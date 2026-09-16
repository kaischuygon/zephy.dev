import { z } from "astro/zod";
import { Client, isFullPage } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

// Framework-agnostic: no astro:content/astro/loaders imports here (astro:content
// is a virtual module that only resolves inside Astro's own Vite pipeline),
// so this same module can be imported both by the astro content loader
// (notionRecipes.ts) and by scripts/snapshot-recipes.ts, a plain Node script
// run outside that pipeline (via `node --experimental-strip-types`) to
// refresh the committed fallback snapshot in CI. See
// src/content/recipes-snapshot.json.
//
// `related` is left as plain page-id strings here (a Notion relation is
// just an array of ids) rather than astro:content's reference("recipes") —
// notionRecipes.ts layers that transform on top, in the schema it actually
// hands to astro's Loader/parseData, which is the only place it can run.

export const rawRecipeSchema = z.object({
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
    related: z.array(z.string()).optional(),
});

export interface RawRecipe {
    id: string;
    data: z.infer<typeof rawRecipeSchema>;
    body: string;
}

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

function getRelation(props: NotionProperties, key: string): string[] {
    const prop = props[key];
    return prop?.type === "relation"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prop.relation.map((r: any) => r.id)
        : [];
}

/**
 * Fetches every recipe from the "🔪 Recipes" Notion database and returns it
 * as plain, recipeSchema-validated data — no astro:content Loader machinery
 * involved, so this can run from either the content loader or a standalone
 * script.
 */
export async function fetchNotionRecipes({
    token,
    dataSourceId,
    log = () => {},
}: {
    token: string;
    dataSourceId: string;
    log?: (message: string) => void;
}): Promise<RawRecipe[]> {
    const notion = new Client({
        auth: token,
        notionVersion: "2025-09-03", // the API version that understands data sources
    });
    const n2m = new NotionToMarkdown({ notionClient: notion });

    log("Fetching recipes from Notion…");

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

    const recipes: RawRecipe[] = [];

    for (const page of pages) {
        if (!isFullPage(page)) continue;

        const name = getTitle(page.properties, "Name");
        if (!name) continue;

        const mdBlocks = await n2m.pageToMarkdown(page.id);
        const { parent: body } = n2m.toMarkdownString(mdBlocks);

        const related = getRelation(page.properties, "Related Recipes");

        const data = rawRecipeSchema.parse({
            name,
            icon: page.icon?.type === "emoji" ? page.icon.emoji : undefined,
            cuisine: getSelect(page.properties, "Cuisine"),
            category: getSelect(page.properties, "Category"),
            status: getSelect(page.properties, "Status"),
            totalTime: getRichText(page.properties, "Total Time"),
            servings: getRichText(page.properties, "Servings"),
            tags: getMultiSelect(page.properties, "Tags"),
            source: getUrl(page.properties, "Source"),
            notionUrl: page.url,
            related: related.length > 0 ? related : undefined,
        });

        recipes.push({ id: page.id, data, body: body ?? "" });
    }

    log(`Fetched ${recipes.length} recipes from Notion.`);

    return recipes;
}
