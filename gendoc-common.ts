
export type NodeCallback<T> = (err? : Error, result? : T) => void;

export interface Doc {
    title: string;
    description: string;
    examples: string[];
}

export function isDoc( d : any ) : d is Doc {
    return 'title' in d && typeof d.title === 'string'
        && 'description' in d && typeof d.description === 'string'
        && 'examples' in d && Array.isArray(d.examples) && d.examples.every(e => typeof e === 'string')
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
   );

export function capture_error_or_result<A1, A2, A3, A4, R>(
   func : (arg1 : A1, arg2 : A2, arg3: A3, arg4 : A4) => R, 
   arg1 : A1, 
   arg2 : A2, 
   arg3: A3, 
   arg4 : A4,
   done : NodeCallback<R>, 
   );

export function capture_error_or_result<A1, A2, A3, R>(
   func : (arg1 : A1, arg2 : A2, arg3: A3) => R, 
   arg1 : A1, 
   arg2 : A2, 
   arg3: A3, 
   done : NodeCallback<R>, 
   );    

export function capture_error_or_result<A1, A2, R>(
   func : (arg1 : A1, arg2 : A2) => R, 
   arg1 : A1, 
   arg2 : A2, 
   done : NodeCallback<R>, 
);    

export function capture_error_or_result<A1, R>(
   func : (arg1 : A1) => R, 
   arg1 : A1, 
   done : NodeCallback<R>, 
   );    

export function capture_error_or_result<R>( ...args : any[] ) {

    const func : (...args) => R = args[0];
    const funcArgs = (args.length > 2) ? args.slice(1, args.length - 2) : [];
    const done : NodeCallback<R> = args[args.length-1]

    // Sanity check arguments

    if (args.length < 2) {
        throw new TypeError('Expected at least 2-arguments (function to call, and callback with result)')
    }

    if (typeof func !== 'function') {
        throw new TypeError('Expected function as first argument');
    }

    if (typeof done !== 'function') {
        throw new TypeError('Expected function as last argument');
    }

    // Do the work

    let response : R;

    try {
        response = func.apply(this, funcArgs);
    } catch (ex) {
        return done(ex);
    }

    done(null, response);

}