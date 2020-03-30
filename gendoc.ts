import { fstat, readFile } from "fs";
import async, { nextTick, concat } from "async";
import {src, dest} from "vinyl-fs";
import { NodeCallback, Doc, isDoc } from "./gendoc-common";
import { CSSReader } from "./gendoc-css";
import { Transform, TransformOptions, Readable, Stream, pipeline } from "stream";
import Vinyl from "vinyl";

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

type Job = JobSingleFile | JobMultiFile;

interface Config {
    jobs : Job[]
}

const JOB_FILE = './gendoc.json'

function isJob( j : any ) : j is Job {
    const isBaseJob = 
        'sourceFiles' in j && typeof j['sourceFiles'] === 'string'
        && 'template' in j && typeof j['template'] === 'string';

    const isSingleFile = 'outputFile' in j && typeof j.outputFile === 'string';
    const isMultiFile = 'outputDir' in j && typeof j.outputDir === 'string';

    return isBaseJob && (isSingleFile || isMultiFile);
}

function isConfig( c : any ) : c is Config {
    return 'jobs' in c 
        && Array.isArray(c.jobs)
        && c.jobs.every(j => isJob(j))
}

function readConfigFile( filename : string, cb : NodeCallback<Config> ) {
    
    async.waterfall([
        
        (next : NodeCallback<string>) => {
            // Read the file
            
            readFile(filename, {}, (err, data) => {
                return (err) ? next(err) : data.toString()
            })
        },

        (data : string, next : NodeCallback<any>) => {
            // Parse JSON
            
            let oConfig = null;
            let eErr = null;

            try {
                oConfig = JSON.parse(data);
            } catch (err) {
                eErr = err;
            }

            next(eErr, oConfig);
        },

        (oConfig : any, next : NodeCallback<Config>) => {
            // Validate the JSON response

            if (! isConfig(oConfig)) {
                next(new Error("Invalid Gendoc configuration"))
            } else {
                next(null, oConfig)
            }
        }

    ], (err? : Error, result? : Config) => {
        // Pass along the results
        cb(err, result);
    })

}

function processConfig( oConfig : Config, done : NodeCallback<void> ) {

    oConfig.jobs.forEach(job => {

        async.waterfall([
            
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
                    trail.push(new StreamConcatVinyl())                
                }

                next(null, trail);
            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                // Applying templates

                // TODO EJS Templates

                next(null, trail);
            },

            (trail : Stream[], next : NodeCallback<Stream[]>) => {
                if ('outputDir' in job) {
                    trail.push(dest(job.outputDir))
                } else {
                    trail.push(dest(job.outputFile))
                }        
            }

        ], (err, result : Stream[]) => {
            if (err) return done(err);

            const args : any[] = result;
            args.push(done)
            pipeline.apply(null, args)
        })

    })

}

import {} from "ejs";
class StreamDocToEjsTemplate extends Transform {
    
    template : string;

    constructor(template : string, opts : TransformOptions = {objectMode : true}) {
        super(opts);
        this.template = template;
    }
    
    _transform(vFile : Vinyl, _encoding : string, done : NodeCallback<Vinyl>) {

        if (! Vinyl.isVinyl(vFile)) {
            return done(new TypeError('Expected Vinyl file, but got something else'))
        }

        const sFileContents = vFile.contents.toString()
        const oaDocs : Doc[] = JSON.parse(sFileContents)

        const ejsData = {};

        if (Array.isArray(oaDocs)) {
            ejsData.docs = oaDocs;
        } else {
            ejsData.doc = oaDocs
        }

        if (! isDoc(oDocs)) {
            return done(new TypeError('Expected Doc inside, but got something else'))
        }

        
        aDocs

        // TODO
        

    }
}

class StreamConcatVinyl extends Transform {
    
    private file : Vinyl;
    private buffer : Array<Buffer>;
    
    constructor(options : TransformOptions = {}) {
        super(options);
        
        this.file = null;
        this.buffer = [];        
    }

    _transform(vFile : Vinyl, _encoding : string, done : NodeCallback<void>) {
        if (! Vinyl.isVinyl(vFile)) {
            done(new TypeError('Expected Vinyl file'));
        }

        if (! this.file) {
            // Duplicate the first file
            // - We'll send a modified version later

            this.file = vFile.clone({deep: false})
            this.file.stem = 'concat';
            this.file.contents = null;
        }

        this.buffer.push(Buffer.from(vFile.contents));
        done();
    }

    _flush(cbDone : NodeCallback<void>) {
        // Fill the contents
        this.file.contents = Buffer.concat(this.buffer);
        this.push(this.file);
        
        // Cleanup
        this.buffer = [];
        this.file = null;

        cbDone();
    }

}

function flatten( a : any[]) {
    if (! Array.isArray(a)) throw new TypeError

    return a.reduce((acc, value) => {
        if (Array.isArray(value)) {
            acc.concat(value);
        } else {
            acc.push(value);
        }
    }, []);
}