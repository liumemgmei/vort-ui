import type { Plugin } from "vite";
import fs from "fs";
import path from "path";

const VIRTUAL_MODULE_ID = "virtual:search-index";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

export interface SearchSection {
    type: "description" | "demo" | "prop" | "event" | "slot" | "method" | "content";
    heading: string;
    text: string;
}

export interface SearchEntry {
    id: string;
    title: string;
    path: string;
    sections: SearchSection[];
}

function pascalToKebab(str: string): string {
    return str
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
        .toLowerCase();
}

function extractSearchData(filePath: string): SearchEntry | null {
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath, ".vue");

    if (!fileName.endsWith("Demo")) return null;

    const componentName = fileName.replace(/Demo$/, "");
    const id = pascalToKebab(componentName);
    const sections: SearchSection[] = [];

    // Page title
    const titleMatch = content.match(/<h1[^>]*class="demo-page-title"[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : componentName;

    // Page description
    for (const m of content.matchAll(/<p[^>]*class="demo-page-desc"[^>]*>([^<]+)<\/p>/g)) {
        sections.push({ type: "description", heading: "描述", text: m[1].trim() });
    }

    // Section descriptions (skip "代码演示" / "API" headings themselves)
    for (const m of content.matchAll(/<p[^>]*class="demo-section-desc"[^>]*>([^<]+)<\/p>/g)) {
        sections.push({ type: "description", heading: "说明", text: m[1].trim() });
    }

    // DemoBox title + description (handles both inline and multiline tags)
    for (const m of content.matchAll(/<DemoBox\s([\s\S]*?)>/g)) {
        const attrs = m[1];
        const t = attrs.match(/title="([^"]+)"/);
        const d = attrs.match(/description="([^"]+)"/);
        if (t) {
            sections.push({
                type: "demo",
                heading: "示例",
                text: t[1] + (d ? " - " + d[1] : ""),
            });
        }
    }

    // Props: { prop: "...", desc: "...", type: "...", ... }
    for (const m of content.matchAll(/{\s*prop:\s*"([^"]+)"[\s\S]*?desc:\s*"([^"]+)"[\s\S]*?type:\s*"([^"]+)"/g)) {
        sections.push({ type: "prop", heading: "Props", text: `${m[1]} - ${m[2]} (${m[3]})` });
    }

    // Events: { event: "...", desc: "...", ... }
    for (const m of content.matchAll(/{\s*event:\s*"([^"]+)"[\s\S]*?desc:\s*"([^"]+)"/g)) {
        sections.push({ type: "event", heading: "Events", text: `${m[1]} - ${m[2]}` });
    }

    // Slots: { slot: "...", desc: "..." }
    for (const m of content.matchAll(/{\s*slot:\s*"([^"]+)"[\s\S]*?desc:\s*"([^"]+)"/g)) {
        sections.push({ type: "slot", heading: "Slots", text: `${m[1]} - ${m[2]}` });
    }

    // Methods: { method: "...", desc: "..." }
    for (const m of content.matchAll(/{\s*method:\s*"([^"]+)"[\s\S]*?desc:\s*"([^"]+)"/g)) {
        sections.push({ type: "method", heading: "Methods", text: `${m[1]} - ${m[2]}` });
    }

    // List items inside demo-section-list
    for (const m of content.matchAll(/<li>([^<]{6,})<\/li>/g)) {
        sections.push({ type: "content", heading: "说明", text: m[1].trim() });
    }

    if (sections.length === 0) return null;
    return { id, title, path: `/components/${id}`, sections };
}

export function searchIndexPlugin(): Plugin {
    let demoDir: string;

    return {
        name: "vite-plugin-search-index",

        configResolved(config) {
            demoDir = path.resolve(config.root, "src/views/demo");
        },

        resolveId(id) {
            if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
        },

        load(id) {
            if (id !== RESOLVED_VIRTUAL_MODULE_ID) return;

            const files = fs.readdirSync(demoDir).filter((f) => f.endsWith("Demo.vue"));
            const entries: SearchEntry[] = [];

            for (const file of files) {
                const entry = extractSearchData(path.join(demoDir, file));
                if (entry) entries.push(entry);
            }

            return `export default ${JSON.stringify(entries)}`;
        },

        handleHotUpdate({ file, server }) {
            if (file.endsWith("Demo.vue") && file.includes("views/demo")) {
                const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
                if (mod) {
                    server.moduleGraph.invalidateModule(mod);
                    return [mod];
                }
            }
        },
    };
}
