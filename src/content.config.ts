// 1. Import utilities from `astro:content`
import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";

// 2. Import loader(s)
import { glob } from "astro/loaders";
import { rssSchema } from "@astrojs/rss";

// 3. Define your collection(s)
const portfolio = defineCollection({
    loader: glob({
        pattern: ["**/*.mdx", "**/*.md"],
        base: "./src/content/portfolio",
    }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        tags: z.array(z.string()),
        img: z.string(),
        img_alt: z.string(),
        related: z.array(reference("blog")).optional(), // must include full path (yyyy/mm/post)
    }),
});

const blog = defineCollection({
    loader: glob({
        pattern: ["**/*.mdx", "**/*.md"],
        base: "./src/content/blog",
    }),
    schema: rssSchema.extend({
        isDraft: z.boolean().default(false),
        pubDate: z.coerce.date(), // publication date in 2024-04-01 format
        tags: z.array(z.string()).optional(), // optional canonical tag list
        img: z.string().optional(), // path to image in src/assets/images
        img_alt: z.string().optional(), // alt-text for provided image
        related: z.array(reference("blog")).optional(), // must include full path (yyyy/mm/post)
    }),
});

const pages = defineCollection({
    loader: glob({
        pattern: ["**/*.mdx", "**/*.md"],
        base: "./src/content/pages",
    }),
    schema: z.object({
        sideNav: z.boolean().default(false),
        title: z.string(),
        description: z.string().optional(),
        emoji: z.string().optional(),
        img: z.string().optional(),
        img_alt: z.string().optional(),
    }),
});

export const collections = { portfolio, blog, pages };
