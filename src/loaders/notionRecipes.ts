import type { Loader, LoaderContext } from "astro/loaders";
import { z } from "astro/zod";
import { reference } from "astro:content";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
    fetchNotionRecipes,
    rawRecipeSchema,
    type RawRecipe,
} from "./notionRecipesFetch";

// Same shape as rawRecipeSchema, but with `related` upgraded from plain
// page-id strings to astro:content references — this transform can only run
// inside Astro's own content-layer pipeline (astro:content is a virtual
// module), which is why it lives here rather than in the framework-agnostic
// notionRecipesFetch.ts.
export const recipeSchema = rawRecipeSchema.extend({
    related: z.array(reference("recipes")).optional(),
});

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

// A git-committed fallback for when Notion is unavailable at build time (no
// token configured, Notion is down, the token's been revoked, ...) — a
// fresh checkout has no prior build to fall back on (.astro/ is gitignored,
// and CI/Vercel builds start from a clean checkout each time), so without
// this the recipes collection would just come up empty in that case rather
// than showing the last known-good data.
//
// Refreshed by `yarn recipes:snapshot` (scripts/snapshot-recipes.ts), run
// hourly by .github/workflows/recipes-rebuild.yml using the same Notion
// credentials as the site itself, committed back to the repo.
const SNAPSHOT_URL = new URL(
    "../content/recipes-snapshot.json",
    import.meta.url,
);

async function readSnapshot(
    log: (message: string) => void,
): Promise<RawRecipe[] | undefined> {
    let raw: string;
    try {
        raw = await readFile(fileURLToPath(SNAPSHOT_URL), "utf-8");
    } catch {
        return undefined;
    }

    try {
        const parsed = JSON.parse(raw) as RawRecipe[];
        // Re-validate — the schema can drift from what's on disk (e.g. a
        // stale snapshot from before a field was added/renamed).
        return parsed.map((recipe) => ({
            ...recipe,
            data: rawRecipeSchema.parse(recipe.data),
        }));
    } catch (err) {
        log(
            `Committed recipes snapshot exists but failed to parse (${err instanceof Error ? err.message : err}) — ignoring it.`,
        );
        return undefined;
    }
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
 * If either is missing, or fetching from Notion fails for any other reason
 * (network error, revoked token, Notion outage, ...), this falls back to
 * the committed snapshot (see SNAPSHOT_URL above) rather than failing the
 * build or shipping an empty collection.
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

            let recipes: RawRecipe[] | undefined;
            let source = "Notion";

            if (token && dataSourceId) {
                try {
                    recipes = await fetchNotionRecipes({
                        token,
                        dataSourceId,
                        log: (message) => logger.info(message),
                    });
                } catch (err) {
                    logger.error(
                        `Failed to fetch recipes from Notion (${err instanceof Error ? err.message : err}) — falling back to the committed snapshot.`,
                    );
                }
            } else {
                logger.warn(
                    "NOTION_TOKEN and/or NOTION_RECIPES_DATA_SOURCE_ID are not set — falling back to the committed snapshot.",
                );
            }

            if (!recipes) {
                recipes = await readSnapshot((m) => logger.warn(m));
                source = "the committed snapshot";
            }

            if (!recipes) {
                logger.warn(
                    "No live Notion data and no committed snapshot found — leaving the recipes collection as whatever is already cached (likely nothing, on a fresh checkout).",
                );
                return;
            }

            const seenIds = new Set<string>();

            for (const { id, data: rawData, body } of recipes) {
                const data = await parseData({ id, data: rawData });
                const digest = generateDigest(data);
                const rendered = await renderMarkdown(body);

                store.set({ id, data, body, digest, rendered });
                seenIds.add(id);
            }

            // Drop anything cached from a previous sync that's no longer in
            // the data source (deleted, moved, or trashed in Notion since).
            for (const id of store.keys()) {
                if (!seenIds.has(id)) store.delete(id);
            }

            logger.info(`Synced ${seenIds.size} recipes from ${source}.`);
        },
    };
}
