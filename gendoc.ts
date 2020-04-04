import {waterfall} from "async";
import {render as renderEjsTemplate} from "ejs"
import { readFile, fstat } from "fs";
import { pipeline, Stream, Transform, TransformOptions } from "stream";
import * as Vinyl from "vinyl";
import { dest, src } from "vinyl-fs";

import { capture_error_or_result, Doc, isDoc, NodeCallback, array_flatten } from "./gendoc-common";
import { CSSReader } from "./gendoc-css";
import * as assert from "assert";

interface JobSingleFile {
    sourceFiles : string;
    template : string;
    outputFile : string;
}

interface JobMultiFile {
    sourceFiles : string;
    template : string;
    outputDir : string;
}

export type Job = JobSingleFile | JobMultiFile;

export interface Config {
    jobs : Job[]
}

const JOB_FILE = './gendoc.json'

export function isJob( j : any ) : j is Job {
    const isBaseJob = j &&
        'sourceFiles' in j && typeof j['sourceFiles'] === 'string'
        && 'template' in j && typeof j['template'] === 'string';

    const isSingleFile = j && 'outputFile' in j && typeof j.outputFile === 'string';
    const isMultiFile = j && 'outputDir' in j && typeof j.outputDir === 'string';

    return isBaseJob && (isSingleFile || isMultiFile);
}

export function isConfig( c : any ) : c is Config {
    return c && 'jobs' in c 
        && Array.isArray(c.jobs)
        && c.jobs.every((j : any) => isJob(j))
}

export function readConfigFile( filename : string, cb : NodeCallback<Config> ) {
    
    waterfall([
        
        (next : NodeCallback<string>) => {
            // Read the file
            
            readFile(filename, (err, data) => {
                return (err) ? next(err) : next(null, data.toString())
            })
        },

        (data : string, next : NodeCallback<any>) => {
            // Parse JSON
            
            capture_error_or_result(JSON.parse, data, next);
        },

        (oConfig : any, next : NodeCallback<Config>) => {
            // Validate the JSON response

            if (! isConfig(oConfig)) {
                next(new Error("Invalid Gendoc configuration"))
            } else {
                next(null, oConfig)
            }
        }

    ], cb)

}

export function processConfig( oConfig : Config, done : NodeCallback<void> ) {

    oConfig.jobs.forEach(job => {

        waterfall([
            
            (next : NodeCallback<Stream[]>) => {
                // Source loading

                next(null, [src(job.sourceFiles)])
            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                // Parsing    
                
                if (job.sourceFiles.endsWith('.css')) {
                    trail.push(new CSSReader)
                } 
                
                next(null, trail);
            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                // Condensing if applicable

                if ('outputFile' in job) {
                    trail.push(new StreamConcatVinylJson())                
                }

                next(null, trail);
            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                // Applying templates

                readFile(job.template, (err, buff) => {
                    // Read template file
                    if (err) return next(err);
                    
                    trail.push(new StreamDocToEjsTemplate(buff.toString()))
                    next(null, trail);
                });

            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                // Change file extension

                trail.push(new StreamChangeExtension('html'));
                next(null, trail);
            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                if ('outputDir' in job) {
                    trail.push(dest(job.outputDir))
                } else {
                    trail.push(dest(job.outputFile))
                }   
                
                next(null, trail);
            }

        ], (err, result? : Stream[]) => {
            if (err) return done(err);
            if (!result) return done(new Error('Expected stream pipeline'))

            /**
             * Hack: Due to above use of generics, I'm keeping it simple.
             * Forcing typescript to read pipeline() as taking args of any[]
             */
            const fTypeForcedPipeline : (...args : any[]) => void = pipeline;
            fTypeForcedPipeline.apply(null, [...result, done])
        })

    })

}

class StreamChangeExtension extends Transform {

    extension : string;

    constructor(extension : string, opts : TransformOptions = {objectMode : true}) {
        super(opts);

        assert.strictEqual(typeof extension, "string", "Expected file extension to be set")
        
        if (extension.length > 0 && extension[0] !== '.') {
            extension = '.' + extension;
        }

        this.extension = extension;
    }

    _transform(vFile : any, _encoding : string, done : NodeCallback<Vinyl>) {

        if (! Vinyl.isVinyl(vFile)) {
            return done(new Error('Expected Vinyl file, but got something else'));
        }

        assert.strictEqual(typeof this.extension, "string", "Expected file extension to be set")
        
        vFile.extname = this.extension;
        done(null, vFile);

    }

}

class StreamDocToEjsTemplate extends Transform {
    
    template : string;

    constructor(template : string, opts : TransformOptions = {objectMode : true}) {
        super(opts);
        this.template = template;
    }
    
    _transform(vFile : any, _encoding : string, done : NodeCallback<Vinyl>) {

        waterfall([

            (next : NodeCallback<Vinyl>) => {
                // Enforce Vinyl
                
                if (! Vinyl.isVinyl(vFile)) {
                    return next(new TypeError('Expected Vinyl file, but got something else'))
                }

                next(null, vFile);
            },

            (vFile : Vinyl, next : NodeCallback<any>) => {
                // Parse JSON contents

                const sFileContents = vFile.contents ? vFile.contents.toString() : '';
                capture_error_or_result(JSON.parse, sFileContents, next);

            },

            ( anything : any, next : NodeCallback<{doc : Doc}|{docs : Doc[]}> ) => {
                // Prepare data for template
                
                const ejsData = {};
                
                if (Array.isArray(anything)) anything = array_flatten(anything, 1);

                if (Array.isArray(anything) && anything.every(d => isDoc(d))) {
                    // Handle an array of docs
                    next(null, { docs: anything })

                } else if (isDoc(anything)) {
                    // Handle a lone Doc
                    next(null, { doc: anything });

                } else {
                    // Boogeyman has arrived, call the alarm
                    return next(new TypeError('Expected Doc in file contents, but got something else'))
                }

            },

            ( ejsData : Object, next : NodeCallback<string> ) => {
                // Apply the data to template

                capture_error_or_result(renderEjsTemplate, this.template, ejsData, next);

            },

            ( hydratedTemplate : string, next : NodeCallback<Vinyl> ) => {

                // Update vinyl file, and pass it along
                vFile.contents = Buffer.from(hydratedTemplate);
                next(null, vFile);

            }

        ], done);

    }
}

class StreamConcatVinylJson extends Transform {
    
    private file : Vinyl | undefined;
    private buffer : Array<Buffer>;

    static JSON_ARRAY_OPEN = Buffer.from('[');
    static JSON_ARRAY_SEPARATOR = Buffer.from(',');
    static JSON_ARRAY_CLOSE = Buffer.from(']');
    
    constructor(options : TransformOptions = {objectMode: true}) {
        super(options);
        
        this.buffer = [];        
    }

    _transform(vFile : Vinyl, _encoding : string, done : NodeCallback<void>) {
        if (! Vinyl.isVinyl(vFile)) {
            done(new TypeError('Expected Vinyl file'));
        }

        if (this.buffer.length === 0) this.buffer.push(StreamConcatVinylJson.JSON_ARRAY_OPEN);

        if (vFile.contents) {
            this.buffer.push(
                Buffer.from(vFile.contents.toString()),
                StreamConcatVinylJson.JSON_ARRAY_SEPARATOR
                )
        }

        if (! this.file) {
            // Duplicate the first file
            // - We'll send a modified version later

            this.file = vFile.clone({deep: false})
            this.file.stem = 'concat';
            this.file.contents = null;
        }

        done();
    }

    _flush(cbDone : NodeCallback<void>) {

        // If we have content, fill and send
        if (this.file && this.buffer.length > 0) {

            if (this.buffer[this.buffer.length - 1] === StreamConcatVinylJson.JSON_ARRAY_SEPARATOR) {
                this.buffer[this.buffer.length - 1] = StreamConcatVinylJson.JSON_ARRAY_CLOSE
            } else {
                this.buffer.push(StreamConcatVinylJson.JSON_ARRAY_CLOSE)
            }

            this.file.contents = Buffer.concat(this.buffer);
            this.push(this.file);
        }
        
        // Cleanup
        this.buffer = [];
        this.file = void 0;

        cbDone();
        
    }

}