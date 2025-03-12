// types.ts
export interface CodeSnippet {
    HTML?: string | Array<{name: string, content: string}>;
    API?: string | Array<{name: string, content: string}>;
    JS?: string | Array<{name: string, content: string}>;
    Front?: string | Array<{name: string, content: string}>;
    Back?: string | Array<{name: string, content: string}>;
    [key: string]: string | Array<{name: string, content: string}> | undefined;
}

export interface CodeMap {
    [pageName: string]: CodeSnippet;
}