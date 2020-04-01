import {waterfall} from "async";
import * as parseDocComment from "comment-parser";
import { Comment, parse, ParserOptions, Rule, Stylesheet } from "css";
import { Transform, TransformOptions } from "stream";
import * as Vinyl from "vinyl";

import { Doc, NodeCallback } from "./gendoc-common";

export class CSSReader extends Transform {
    constructor(opts : TransformOptions = {objectMode : true}) {
        super(opts)
    }

    _transform(vFile : Vinyl, _encoding : string, done : NodeCallback<Doc[]> ) {
        
        if (! Vinyl.isVinyl(vFile)) {
            done(new Error(`${CSSReader.name} can only process Vinyl files.`))
        }

        const sChunk = vFile.contents ? vFile.contents.toString() : '';
        
        parseCss(sChunk, (err, docs) => {

            if (err) return done(err);

            const sResult = JSON.stringify(docs);
            vFile.contents = Buffer.from(sResult);
            this.push(vFile);

            done();

        });
        
    }
}

export function parseCss( cssSource : string, cb : NodeCallback<Doc[]> ) {

    waterfall([
        
        (next : NodeCallback<Stylesheet>) => {
            getAstFromCss(cssSource, {silent: true}, next);
        },

        (ast : Stylesheet, next : NodeCallback<DocumentedRule[]>) => {
            // Simplify the AST
            getDocumentedElementsFromCssAst(ast, next);
        },

        (adRules : DocumentedRule[], next : NodeCallback<Doc[]>) => {
            // Convert the AST into Gendoc Documents

            next(null, adRules.map(r => {
                const astComment = parseDocComment('/*' + r.comment.comment + '*/', {})[0];
                
                return {
                    title: (r.rule.selectors || []).join(', '),
                    description: astComment.description,
                    examples: astComment.tags
                        .filter(t => t.tag === 'example')
                        .map(tag => tag.description)
                }

            }));

        }

    ], cb);

}

function getAstFromCss( source : string, options : ParserOptions = {silent : true}, cb : NodeCallback<Stylesheet> ) {

    const ast = parse(source, options);
    
    if (! ('stylesheet' in ast) || !ast.stylesheet) {
        return cb(new Error('AST does not include Stylesheet element'));
    }

    if (Array.isArray(ast.stylesheet.parsingErrors) && ast.stylesheet.parsingErrors.length > 0) {
        
        /* HACK: 
           TypeScript reports "ParseError" requires "name"... 
           however "ParseError" inherits from "Error", which provides a default 
           name "Error"
           
           Fixed with a type-cast :o
           */
        cb(<Error>ast.stylesheet.parsingErrors[0]) // Report the first error

    } else {

        cb(null, ast);

    }

}

interface DocumentedRule {
    rule : Rule;
    comment : Comment;
}

function getDocumentedElementsFromCssAst( ast : Stylesheet, cb : NodeCallback<DocumentedRule[]> ) {
    
    const dRules : DocumentedRule[] = [];

    if (! ('stylesheet' in ast) || !ast.stylesheet) {
        return cb(new Error('Expected stylesheet element on AST'))
    }

    ast.stylesheet.rules.forEach((astRule, ixRules, arrRules) => {
        
        if (isDocComment(astRule)) {
            const nextRule = arrRules[ixRules + 1];
            
            // If doc comment precedes a rule, tag it
            if (nextRule && nextRule.type === 'rule') {
                dRules.push({
                    rule : nextRule,
                    comment : astRule
                });
            }
            
        }

    })

    return cb(null, dRules);

    function isDocComment( o : any ) : o is Comment {
        return 'type' in o && o.type === 'comment'
            && 'comment' in o && typeof o.comment === 'string' && o.comment.startsWith('*')
    }

}