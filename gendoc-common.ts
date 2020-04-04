import { AssertionError } from "assert";

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

interface ArrayPointer {
    arr : any[];
    ix : number;
}

export function array_flatten( arr : any[], depth = 1 ) {

    if (! Array.isArray(arr)) throw new TypeError(`${array_flatten.name}: Expected array argument`);
    if (!Number.isInteger(depth) || depth < 0) throw new RangeError(`${array_flatten.name}: Maximum depth should be a positive integer`);

    const aStack : ArrayPointer[] = Array(depth+1)
    const aRes : any[] = [];

    let ixStack = 0;
    aStack[ixStack] = { arr: arr, ix: 0 };
    
STACK_LOOP:
    while (ixStack > -1) {
        const apCurrent = aStack[ixStack]

        for (; apCurrent.ix < apCurrent.arr.length; apCurrent.ix++) {
            const iCurrent = apCurrent.arr[apCurrent.ix];

            // If we've not exceeded max-depth, unravel any arrays first
            if (ixStack < depth && Array.isArray(iCurrent)) {
                
                // Add the array to the search stack
                ixStack++;
                aStack[ixStack] = { arr: iCurrent, ix: 0 };
                
                // Move the current index to the next item
                // Required to avoid an infinite looping.
                apCurrent.ix++;

                // Process the next array on the search stack
                continue STACK_LOOP;

            } else {

                // Add the result
                aRes.push(iCurrent);

            }
        }

        // Remove the array from the search stack
        // We just change the index here, no need to clear existing contents
        ixStack--;
    }

    return aRes;

}