// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

// 2. Import loader(s)
import { file, glob } from 'astro/loaders';

// 3. Define your collection(s)
const portfolio = defineCollection({ 
    loader: glob({ pattern: ["**/*.mdx", "**/*.md"], base: "./src/content/portfolio" }),
    schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.coerce.date(),
		tags: z.array(z.string()),
		img: z.string(),
		img_alt: z.string()
	})
});

const blog = defineCollection({
    loader: glob({ pattern: ["**/*.mdx", "**/*.md"], base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.coerce.date(),
		tags: z.array(z.string()),
		img: z.string().optional(),
		img_alt: z.string().optional(),
	})
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { portfolio, blog };
