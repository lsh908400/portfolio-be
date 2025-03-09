export interface CodeSnippet {
    HTML?: string;
    CSS?: string;
    JS?: string;
    Front?: string;
    Back?: string;
}

export interface CodeMap {
    [pageName: string]: CodeSnippet;
}