// 1. Import utilities from `astro:content`
import { defineCollection, reference, z } from 'astro:content';

// 2. Import loader(s)
import { glob } from 'astro/loaders';
import { rssSchema } from '@astrojs/rss';

// 3. Define your collection(s)
const portfolio = defineCollection({ 
    loader: glob({ pattern: ["**/*.mdx", "**/*.md"], base: "./src/content/portfolio" }),
    schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()),
		img: z.string(),
		img_alt: z.string()
	})
});

const blog = defineCollection({
    loader: glob({ pattern: ["**/*.mdx", "**/*.md"], base: "./src/content/blog" }),
	schema: rssSchema.extend({
		isDraft: z.boolean().default(false),
		pubDate: z.coerce.date(), // publication date in 2024-04-01 format
		img: z.string().optional(), // path to image in src/assets/images
		img_alt: z.string().optional(), // alt-text for provided image
		related: z.array(reference('blog')).optional() // must include full path (yyyy/mm/post)
	})
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { portfolio, blog };
