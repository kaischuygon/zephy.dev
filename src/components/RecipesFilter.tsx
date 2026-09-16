import { useEffect, useRef, useState } from "react";

const TAG_QUERY_KEY = "tag";
const CUISINE_QUERY_KEY = "cuisine";
const CATEGORY_QUERY_KEY = "category";
const CARD_SELECTOR = "[data-recipe-card]";

interface Tag {
    slug: string;
    label: string;
    count: number;
}

interface Props {
    availableCuisines?: [string, string][];
    availableCategories?: [string, string][];
    availableTags?: Tag[];
    topTagCount?: number;
}

interface UrlState {
    tags: string[];
    cuisine: string;
    category: string;
}

/**
 * Filter controls for the recipes list. The actual cards stay
 * server-rendered Astro markup (Recipes.astro) — this island only owns the
 * filter UI + which cards are visible, reading card metadata off their
 * data-cuisine/data-category/data-tags attributes rather than duplicating
 * that data as props, and syncing selection to the URL query string.
 */
export default function RecipesFilter({
    availableCuisines = [],
    availableCategories = [],
    availableTags = [],
    topTagCount = 10,
}: Props) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCuisine, setSelectedCuisine] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const hydrated = useRef(false);
    const validTagSlugs = useRef(new Set(availableTags.map((tag) => tag.slug)));

    const readFromUrl = (): UrlState => {
        const params = new URLSearchParams(window.location.search);
        const rawTags = params
            .getAll(TAG_QUERY_KEY)
            .flatMap((value) => value.split(","))
            .map((value) => value.trim())
            .filter(Boolean);

        return {
            tags: [...new Set(rawTags)].filter((slug) =>
                validTagSlugs.current.has(slug),
            ),
            cuisine: params.get(CUISINE_QUERY_KEY) || "",
            category: params.get(CATEGORY_QUERY_KEY) || "",
        };
    };

    // Client-only: read initial selection from the URL after mount (avoids
    // an SSR/hydration mismatch, same pattern as AccentSelect/SurfaceSelect).
    useEffect(() => {
        const state = readFromUrl();
        setSelectedTags(state.tags);
        setSelectedCuisine(state.cuisine);
        setSelectedCategory(state.category);
        hydrated.current = true;

        const onPopState = () => {
            const s = readFromUrl();
            setSelectedTags(s.tags);
            setSelectedCuisine(s.cuisine);
            setSelectedCategory(s.category);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Apply the current selection to the server-rendered cards + sync the
    // URL, whenever it changes (skipped until the URL has been read once).
    useEffect(() => {
        if (!hydrated.current) return;

        const selectedSet = new Set(selectedTags);
        const showAllTags = selectedSet.size === 0;
        const cards = Array.from(
            document.querySelectorAll<HTMLElement>(CARD_SELECTOR),
        );
        for (const card of cards) {
            const tagList = (card.getAttribute("data-tags") || "")
                .split(" ")
                .filter(Boolean);
            const cardCuisine = card.getAttribute("data-cuisine") || "";
            const cardCategory = card.getAttribute("data-category") || "";
            const matchesTags =
                showAllTags || tagList.some((tag) => selectedSet.has(tag));
            const matchesCuisine =
                !selectedCuisine || cardCuisine === selectedCuisine;
            const matchesCategory =
                !selectedCategory || cardCategory === selectedCategory;
            card.style.display =
                matchesTags && matchesCuisine && matchesCategory
                    ? "block"
                    : "none";
        }

        const url = new URL(window.location.href);
        url.searchParams.delete(TAG_QUERY_KEY);
        url.searchParams.delete(CUISINE_QUERY_KEY);
        url.searchParams.delete(CATEGORY_QUERY_KEY);
        for (const slug of selectedTags) {
            url.searchParams.append(TAG_QUERY_KEY, slug);
        }
        if (selectedCuisine) {
            url.searchParams.set(CUISINE_QUERY_KEY, selectedCuisine);
        }
        if (selectedCategory) {
            url.searchParams.set(CATEGORY_QUERY_KEY, selectedCategory);
        }
        const search = url.searchParams.toString();
        window.history.replaceState(
            {},
            "",
            `${url.pathname}${search ? `?${search}` : ""}${url.hash}`,
        );
    }, [selectedTags, selectedCuisine, selectedCategory]);

    const toggleTag = (slug: string) => {
        if (slug === "all") {
            setSelectedTags([]);
            return;
        }
        setSelectedTags((prev) =>
            prev.includes(slug)
                ? prev.filter((s) => s !== slug)
                : [...prev, slug],
        );
    };

    const filtersActive =
        selectedTags.length > 0 ||
        Boolean(selectedCuisine) ||
        Boolean(selectedCategory);
    const showAllTags = selectedTags.length === 0;
    const visibleTags = tagsExpanded
        ? availableTags
        : availableTags.slice(0, topTagCount);

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="mb-2 text-xl font-semibold">Filter by</h2>
                <button
                    type="button"
                    className="clickable btn px-2 py-1 text-sm"
                    disabled={!filtersActive}
                    onClick={() => {
                        setSelectedTags([]);
                        setSelectedCuisine("");
                        setSelectedCategory("");
                    }}
                >
                    Clear filters
                </button>
            </div>

            {(availableCuisines.length > 0 ||
                availableCategories.length > 0) && (
                <section className="mb-4 flex flex-wrap items-end gap-2">
                    {availableCuisines.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="recipe-cuisine-filter"
                                className="font-semibold"
                            >
                                Cuisine
                            </label>
                            <select
                                id="recipe-cuisine-filter"
                                className="clickable btn px-2 py-1 text-sm"
                                data-cuisine-filter
                                data-active={selectedCuisine ? "true" : "false"}
                                value={selectedCuisine}
                                onChange={(e) =>
                                    setSelectedCuisine(e.target.value)
                                }
                            >
                                <option value="">All cuisines</option>
                                {availableCuisines.map(([slug, label]) => (
                                    <option key={slug} value={slug}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {availableCategories.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="recipe-category-filter"
                                className="font-semibold"
                            >
                                Category
                            </label>
                            <select
                                id="recipe-category-filter"
                                className="clickable btn px-2 py-1 text-sm"
                                data-category-filter
                                data-active={
                                    selectedCategory ? "true" : "false"
                                }
                                value={selectedCategory}
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
                            >
                                <option value="">All categories</option>
                                {availableCategories.map(([slug, label]) => (
                                    <option key={slug} value={slug}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </section>
            )}

            {availableTags.length > 0 && (
                <section className="mb-4 flex flex-col gap-1">
                    <label className="font-semibold">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="clickable btn px-2 py-1 text-sm"
                            data-tag-filter="all"
                            data-active={showAllTags ? "true" : "false"}
                            aria-pressed={showAllTags ? "true" : "false"}
                            onClick={() => toggleTag("all")}
                        >
                            All
                        </button>
                        {visibleTags.map((tag) => (
                            <button
                                key={tag.slug}
                                type="button"
                                className="clickable btn flex items-center gap-1 px-2 py-1 text-sm"
                                data-tag-filter={tag.slug}
                                data-active={
                                    selectedTags.includes(tag.slug)
                                        ? "true"
                                        : "false"
                                }
                                aria-pressed={
                                    selectedTags.includes(tag.slug)
                                        ? "true"
                                        : "false"
                                }
                                onClick={() => toggleTag(tag.slug)}
                            >
                                <span>{tag.label}</span>
                                <span className="text-xs opacity-60">
                                    {tag.count}
                                </span>
                            </button>
                        ))}
                        {availableTags.length > topTagCount && (
                            <button
                                type="button"
                                className="clickable btn px-2 py-1 text-sm"
                                aria-expanded={tagsExpanded ? "true" : "false"}
                                onClick={() => setTagsExpanded((v) => !v)}
                            >
                                {tagsExpanded ? "Show less" : "Show all"}
                            </button>
                        )}
                    </div>
                </section>
            )}
        </>
    );
}
