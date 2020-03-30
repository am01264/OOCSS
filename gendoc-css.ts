import {parse, Stylesheet, ParserOptions, Rule, Comment} from "css"
import async from "async";
import parseDocComment from "comment-parser"

import {Doc, NodeCallback} from "./gendoc-common"
import { Transform, TransformOptions } from "stream";

import Vinyl from "vinyl"

export class CSSReader extends Transform {
    constructor(opts : TransformOptions = {objectMode : true}) {
        super(opts)
    }

    _transform(vFile : Vinyl, _encoding : string, done : NodeCallback<Doc[]> ) {
        
        if (! Vinyl.isVinyl(vFile)) {
            done(new Error(`${CSSReader.name} can only process Vinyl files.`))
        }

        const sChunk = vFile.contents.toString();
        const sResult = JSON.stringify(parseCss(sChunk, done));

        vFile.contents = Buffer.from(sResult);
        this.push(vFile);

        done();
    }
}

export function parseCss( cssSource : string, cb : NodeCallback<Doc[]> ) {

    async.waterfall([
        
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
                    title: r.rule.selectors.join(', '),
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
    
    if (ast.stylesheet.parsingErrors.length > 0) {
        
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
    
    const dRules = [];

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

    function isDocComment( o ) : o is Comment {
        return 'type' in o && o.type === 'comment'
            && 'comment' in o && typeof o.comment === 'string' && o.comment.startsWith('*')
    }

}