
type ParamFalsy = null | undefined; // Ignoring false, integer 0, empty string & NaN 

export type NodeCallback<T> = (err? : ParamFalsy | Error, result? : T) => void;

export interface Doc {
    title: string;
    description: string;
    examples: string[];
}

export function isDoc( d : any ) : d is Doc {
    return d && 'title' in d && typeof d.title === 'string'
        && 'description' in d && typeof d.description === 'string'
        && 'examples' in d && Array.isArray(d.examples) && d.examples.every((e : any) => typeof e === 'string')
}

/**
* Example usage
* 
* callbackify(JSON.parse, '"Bob"', (err, res) => {
*     if (err) throw err;
*     else console.log(`We found ${res}!`)
* })
* 
* Comes with full typing up to 5-parameters.
*/
export function capture_error_or_result<A1, A2, A3, A4, A5, R>(
   func : (arg1 : A1, arg2 : A2, arg3: A3, arg4 : A4, arg5 : A5) => R, 
   arg1 : A1, 
   arg2 : A2, 
   arg3: A3, 
   arg4 : A4, 
   arg5 : A5,
   done : NodeCallback<R>, 
) : void;

export function capture_error_or_result<A1, A2, A3, A4, R>(
   func : (arg1 : A1, arg2 : A2, arg3: A3, arg4 : A4) => R, 
   arg1 : A1, 
   arg2 : A2, 
   arg3: A3, 
   arg4 : A4,
   done : NodeCallback<R>, 
) : void;

export function capture_error_or_result<A1, A2, A3, R>(
   func : (arg1 : A1, arg2 : A2, arg3: A3) => R, 
   arg1 : A1, 
   arg2 : A2, 
   arg3: A3, 
   done : NodeCallback<R>, 
) : void;    

export function capture_error_or_result<A1, A2, R>(
   func : (arg1 : A1, arg2 : A2) => R, 
   arg1 : A1, 
   arg2 : A2, 
   done : NodeCallback<R>, 
) : void;    

export function capture_error_or_result<A1, R>(
   func : (arg1 : A1) => R, 
   arg1 : A1, 
   done : NodeCallback<R>, 
) : void;    

export function capture_error_or_result<R>( ...args : any[] ) : void {

    const func : (...args : any[]) => R = args.shift(); // First item
    const done : NodeCallback<R> = args.pop(); // Last item
    const funcArgs = args; // Whatever is left

    // Sanity check arguments

    if (typeof func !== 'function') {
        throw new TypeError('Expected function as first argument');
    }

    if (typeof done !== 'function') {
        throw new TypeError('Expected function as last argument');
    }

    // Do the work

    let response : R;

    try {
        response = func.apply(null, funcArgs);
    } catch (ex) {
        return done(ex);
    }

    done(null, response);

}