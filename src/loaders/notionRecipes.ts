import type { Loader, LoaderContext } from "astro/loaders";
import { z } from "astro/zod";
import { Client, isFullPage } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

// Content loaders run outside Vite's usual request pipeline, so .env values
// never make it to import.meta.env/process.env the way they do in pages —
// so load it ourselves. process.loadEnvFile (Node 20.6+) never overrides a
// variable that's already set, so this is a no-op wherever the platform
// injects env vars directly instead of via a file (e.g. Vercel).
try {
    process.loadEnvFile();
} catch {
    // no .env file present — fine locally-without-one or on a platform that
    // injects env vars directly
}

export const recipeSchema = z.object({
    name: z.string(),
    icon: z.string().optional(),
    cuisine: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    totalTime: z.string().optional(),
    servings: z.string().optional(),
    tags: z.array(z.string()).default([]),
    source: z.url().optional(),
    notionUrl: z.url(),
});

// Notion's property-value shapes are a big discriminated union; these
// helpers just narrow the couple of types the Recipes schema actually uses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionProperties = Record<string, any>;

function getTitle(props: NotionProperties, key: string): string {
    const prop = props[key];
    if (prop?.type !== "title") return "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prop.title.map((t: any) => t.plain_text).join("");
}

function getSelect(props: NotionProperties, key: string): string | undefined {
    const prop = props[key];
    return prop?.type === "select"
        ? (prop.select?.name ?? undefined)
        : undefined;
}

function getMultiSelect(props: NotionProperties, key: string): string[] {
    const prop = props[key];
    return prop?.type === "multi_select"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prop.multi_select.map((o: any) => o.name)
        : [];
}

function getRichText(props: NotionProperties, key: string): string | undefined {
    const prop = props[key];
    if (prop?.type !== "rich_text") return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = prop.rich_text.map((t: any) => t.plain_text).join("");
    return text || undefined;
}

function getUrl(props: NotionProperties, key: string): string | undefined {
    const prop = props[key];
    return prop?.type === "url" ? (prop.url ?? undefined) : undefined;
}

/**
 * Loads the "🔪 Recipes" Notion database into the `recipes` content
 * collection.
 *
 * Reads two env vars, neither of which are set in this repo — you'll need
 * to add them locally (.env, gitignored) and in Vercel's project settings:
 *
 *   NOTION_TOKEN                 — secret for a Notion internal integration
 *                                  that's been shared with the Recipes
 *                                  database (Notion → the database → "..."
 *                                  menu → Connections → add your integration)
 *   NOTION_RECIPES_DATA_SOURCE_ID — the data source id for that database.
 *                                  Notion's own tools expose this as a
 *                                  `collection://<id>` url; the id is just
 *                                  the uuid part.
 *
 * If either is missing, this logs a warning and leaves whatever was
 * previously synced in the store untouched, rather than failing the whole
 * build — handy for local dev before you've wired up credentials.
 */
export function notionRecipesLoader(): Loader {
    return {
        name: "notion-recipes-loader",
        schema: recipeSchema,
        load: async ({
            store,
            logger,
            parseData,
            generateDigest,
            renderMarkdown,
        }: LoaderContext) => {
            const token = process.env.NOTION_TOKEN;
            const dataSourceId = process.env.NOTION_RECIPES_DATA_SOURCE_ID;

            if (!token || !dataSourceId) {
                logger.warn(
                    "NOTION_TOKEN and/or NOTION_RECIPES_DATA_SOURCE_ID are not set — skipping the recipes sync and keeping whatever is already cached (likely nothing, on a fresh checkout).",
                );
                return;
            }

            const notion = new Client({
                auth: token,
                notionVersion: "2025-09-03", // the API version that understands data sources
            });
            const n2m = new NotionToMarkdown({ notionClient: notion });

            logger.info("Fetching recipes from Notion…");

            const pages: Awaited<
                ReturnType<typeof notion.dataSources.query>
            >["results"] = [];
            let cursor: string | undefined;
            do {
                const response = await notion.dataSources.query({
                    data_source_id: dataSourceId,
                    start_cursor: cursor,
                });
                pages.push(...response.results);
                cursor = response.has_more
                    ? (response.next_cursor ?? undefined)
                    : undefined;
            } while (cursor);

            const seenIds = new Set<string>();

            for (const page of pages) {
                if (!isFullPage(page)) continue;

                const name = getTitle(page.properties, "Name");
                if (!name) continue;

                const mdBlocks = await n2m.pageToMarkdown(page.id);
                const { parent: body } = n2m.toMarkdownString(mdBlocks);

                const data = await parseData({
                    id: page.id,
                    data: {
                        name,
                        icon:
                            page.icon?.type === "emoji"
                                ? page.icon.emoji
                                : undefined,
                        cuisine: getSelect(page.properties, "Cuisine"),
                        category: getSelect(page.properties, "Category"),
                        status: getSelect(page.properties, "Status"),
                        totalTime: getRichText(page.properties, "Total Time"),
                        servings: getRichText(page.properties, "Servings"),
                        tags: getMultiSelect(page.properties, "Tags"),
                        source: getUrl(page.properties, "Source"),
                        notionUrl: page.url,
                    },
                });

                const digest = generateDigest(data);
                const rendered = await renderMarkdown(body ?? "");

                store.set({ id: page.id, data, body, digest, rendered });
                seenIds.add(page.id);
            }

            // Drop anything cached from a previous sync that's no longer in
            // the data source (deleted, moved, or trashed in Notion since).
            for (const id of store.keys()) {
                if (!seenIds.has(id)) store.delete(id);
            }

            logger.info(`Synced ${seenIds.size} recipes from Notion.`);
        },
    };
}
