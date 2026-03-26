import type { CollectionEntry } from "astro:content";

const TAG_ALIASES: Record<string, string> = {
    "app dev": "App Development",
    "app development": "App Development",
    "android dev": "Android Development",
    "android development": "Android Development",
    "ios dev": "iOS Development",
    "ios development": "iOS Development",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "kino wtf": "🍿 kino.wtf",
    "mdx": "MDX",
    "tailwind": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "typescript": "TypeScript",
    "web dev": "Web Development",
    "web development": "Web Development",
    "ux": "UX Design",
    "ux design": "UX Design",
    // Ensure all variants of zephy.dev map to the emoji version
    "zephy.dev": "💨 zephy.dev",
    "zephy dev": "💨 zephy.dev",
    "zephy-dev": "💨 zephy.dev",
    "zephy_dev": "💨 zephy.dev",
    "astro": "🚀 Astro"
};

function canonicalKey(tag: string): string {
    return tag
        .trim()
        .toLowerCase()
        .replace(/[._-]+/g, " ")
        .replace(/\s+/g, " ");
}

function toTitleCase(value: string): string {
    return value
        .split(" ")
        .map((word) => {
            if (!word) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

export function normalizeTag(tag: string): string {
    const key = canonicalKey(tag);
    if (!key) {
        return "";
    }

    return TAG_ALIASES[key] ?? toTitleCase(key);
}

export function getTagSlug(tag: string): string {
    return normalizeTag(tag)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

export function getPostTags(post: CollectionEntry<"blog">): string[] {
    const sourceTags = [
        ...(post.data.categories ?? []),
        ...(post.data.tags ?? []),
    ];

    const unique = new Set<string>();
    for (const tag of sourceTags) {
        const normalized = normalizeTag(tag);
        if (normalized) {
            unique.add(normalized);
        }
    }

    return [...unique];
}
