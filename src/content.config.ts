// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

// 2. Import loader(s)
import { glob } from 'astro/loaders';

// 3. Define your collection(s)
const portfolio = defineCollection({ 
    loader: glob({ pattern: ["**/*.mdx", "**/*.md"], base: "./src/content/portfolio" }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        tags: z.array(z.string())
    })
});
const blog = defineCollection({ /* ... */ });


// 4. Export a single `collections` object to register your collection(s)
export const collections = { portfolio };
