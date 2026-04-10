/// <reference types="vite/client" />

declare module "virtual:search-index" {
    interface SearchSection {
        type: "description" | "demo" | "prop" | "event" | "slot" | "method" | "content";
        heading: string;
        text: string;
    }

    interface SearchEntry {
        id: string;
        title: string;
        path: string;
        sections: SearchSection[];
    }

    const entries: SearchEntry[];
    export default entries;
}
