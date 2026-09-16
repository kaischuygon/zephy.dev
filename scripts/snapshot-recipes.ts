// Refreshes the committed recipes fallback snapshot
// (src/content/recipes-snapshot.json) from live Notion data. The astro
// content loader (src/loaders/notionRecipes.ts) falls back to that file
// whenever Notion itself isn't reachable at build time (no token, revoked
// token, Notion outage, ...) — a fresh checkout has nothing else to fall
// back on, since .astro/'s own cache is gitignored.
//
// Run locally with `yarn recipes:snapshot` (reads .env same as the site
// does), or via .github/workflows/recipes-rebuild.yml on a schedule, which
// commits the result back to the repo if it changed.
//
// Plain Node script, not part of the Astro/Vite pipeline — run via
// `node --experimental-strip-types` rather than tsx/ts-node so it needs no
// extra dev dependency.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchNotionRecipes } from "../src/loaders/notionRecipesFetch.ts";

try {
    process.loadEnvFile();
} catch {
    // no .env file present — fine in CI, where the env vars are injected
    // directly instead
}

const token = process.env.NOTION_TOKEN;
const dataSourceId = process.env.NOTION_RECIPES_DATA_SOURCE_ID;

if (!token || !dataSourceId) {
    console.error(
        "NOTION_TOKEN and NOTION_RECIPES_DATA_SOURCE_ID must both be set (via .env locally, or the environment in CI).",
    );
    process.exit(1);
}

const recipes = await fetchNotionRecipes({
    token,
    dataSourceId,
    log: (message) => console.log(message),
});

if (recipes.length === 0) {
    console.error(
        "Fetched 0 recipes from Notion — refusing to overwrite the committed snapshot with an empty one (likely a misconfigured token/data source rather than a genuinely empty database).",
    );
    process.exit(1);
}

const outPath = fileURLToPath(
    new URL("../src/content/recipes-snapshot.json", import.meta.url),
);
await writeFile(outPath, JSON.stringify(recipes, null, 4) + "\n", "utf-8");

console.log(`Wrote ${recipes.length} recipes to ${outPath}`);
