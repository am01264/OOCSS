
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