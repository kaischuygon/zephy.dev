import { useEffect, useRef, useState } from "react";

const MONTH_LABELS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const TAG_QUERY_KEY = "tag";
const YEAR_QUERY_KEY = "year";
const MONTH_QUERY_KEY = "month";
const CARD_SELECTOR = "[data-post-card]";

interface Tag {
    slug: string;
    label: string;
    count: number;
}

interface Props {
    availableTags?: Tag[];
    availableYears?: number[];
    topTagCount?: number;
}

interface UrlState {
    tags: string[];
    year: string;
    month: string;
    months: number[];
}

/**
 * Filter controls for the blog's post list. The actual cards stay
 * server-rendered Astro markup (Posts.astro) — this island only owns the
 * filter UI + which cards are visible, reading/writing card metadata via
 * their data-tags/data-year/data-month attributes rather than duplicating
 * that data as props, and syncing selection to the URL query string.
 */
export default function PostsFilter({
    availableTags = [],
    availableYears = [],
    topTagCount = 10,
}: Props) {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [monthsForYear, setMonthsForYear] = useState<number[]>([]);
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const hydrated = useRef(false);
    const validTagSlugs = useRef(new Set(availableTags.map((tag) => tag.slug)));

    const getMonthsForYear = (year: string): number[] => {
        if (!year) return [];
        const cards = Array.from(document.querySelectorAll(CARD_SELECTOR));
        const months = cards
            .filter((card) => (card.getAttribute("data-year") || "") === year)
            .map((card) =>
                Number.parseInt(card.getAttribute("data-month") || "", 10),
            )
            .filter(
                (month) => Number.isInteger(month) && month >= 1 && month <= 12,
            );
        return [...new Set(months)].sort((a, b) => a - b);
    };

    const readFromUrl = (): UrlState => {
        const params = new URLSearchParams(window.location.search);
        const rawTags = params
            .getAll(TAG_QUERY_KEY)
            .flatMap((value) => value.split(","))
            .map((value) => value.trim())
            .filter(Boolean);
        const tags = [...new Set(rawTags)].filter((slug) =>
            validTagSlugs.current.has(slug),
        );

        const validYears = new Set(availableYears.map(String));
        const yearParam = params.get(YEAR_QUERY_KEY) || "";
        const year = validYears.has(yearParam) ? yearParam : "";

        const months = getMonthsForYear(year);
        const validMonths = new Set(months.map(String));
        const monthParam = params.get(MONTH_QUERY_KEY) || "";
        const month = validMonths.has(monthParam) ? monthParam : "";

        return { tags, year, month, months };
    };

    // Client-only: read initial selection from the URL after mount (avoids
    // an SSR/hydration mismatch, same pattern as AccentSelect/SurfaceSelect).
    useEffect(() => {
        const { tags, year, month, months } = readFromUrl();
        setSelectedTags(tags);
        setSelectedYear(year);
        setSelectedMonth(month);
        setMonthsForYear(months);
        hydrated.current = true;

        const onPopState = () => {
            const state = readFromUrl();
            setSelectedTags(state.tags);
            setSelectedYear(state.year);
            setSelectedMonth(state.month);
            setMonthsForYear(state.months);
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
        const showAll = selectedSet.size === 0;
        const cards = Array.from(
            document.querySelectorAll<HTMLElement>(CARD_SELECTOR),
        );
        for (const card of cards) {
            const tagList = (card.getAttribute("data-tags") || "")
                .split(" ")
                .filter(Boolean);
            const cardYear = card.getAttribute("data-year") || "";
            const cardMonth = card.getAttribute("data-month") || "";
            const matchesTags =
                showAll || tagList.some((tag) => selectedSet.has(tag));
            const matchesYear = !selectedYear || cardYear === selectedYear;
            const matchesMonth = !selectedMonth || cardMonth === selectedMonth;
            card.style.display =
                matchesTags && matchesYear && matchesMonth ? "block" : "none";
        }

        const url = new URL(window.location.href);
        url.searchParams.delete(TAG_QUERY_KEY);
        url.searchParams.delete(YEAR_QUERY_KEY);
        url.searchParams.delete(MONTH_QUERY_KEY);
        for (const slug of selectedTags) {
            url.searchParams.append(TAG_QUERY_KEY, slug);
        }
        if (selectedYear) url.searchParams.set(YEAR_QUERY_KEY, selectedYear);
        if (selectedMonth) {
            url.searchParams.set(MONTH_QUERY_KEY, selectedMonth);
        }
        const search = url.searchParams.toString();
        window.history.replaceState(
            {},
            "",
            `${url.pathname}${search ? `?${search}` : ""}${url.hash}`,
        );
    }, [selectedTags, selectedYear, selectedMonth]);

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

    const handleYearChange = (year: string) => {
        const months = getMonthsForYear(year);
        setSelectedYear(year);
        setMonthsForYear(months);
        if (!months.map(String).includes(selectedMonth)) {
            setSelectedMonth("");
        }
    };

    const filtersActive =
        selectedTags.length > 0 ||
        Boolean(selectedYear) ||
        Boolean(selectedMonth);
    const showAll = selectedTags.length === 0;
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
                        setSelectedYear("");
                        setSelectedMonth("");
                        setMonthsForYear([]);
                    }}
                >
                    Clear filters
                </button>
            </div>

            {availableTags.length > 0 && (
                <section className="mb-4 flex flex-col gap-1">
                    <label className="font-semibold">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="clickable btn px-2 py-1 text-sm"
                            data-tag-filter="all"
                            data-active={showAll ? "true" : "false"}
                            aria-pressed={showAll ? "true" : "false"}
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

            {availableYears.length > 0 && (
                <section className="mb-4 flex flex-wrap items-end gap-2">
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="post-year-filter"
                            className="font-semibold"
                        >
                            Year
                        </label>
                        <select
                            id="post-year-filter"
                            className="clickable btn px-2 py-1 text-sm"
                            data-year-filter
                            data-active={selectedYear ? "true" : "false"}
                            value={selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                        >
                            <option value="">All years</option>
                            {availableYears.map((year) => (
                                <option key={year} value={String(year)}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="post-month-filter"
                            className="font-semibold"
                        >
                            Month
                        </label>
                        <select
                            id="post-month-filter"
                            className="clickable btn px-2 py-1 text-sm"
                            data-month-filter
                            data-active={selectedMonth ? "true" : "false"}
                            value={selectedMonth}
                            disabled={
                                !selectedYear || monthsForYear.length === 0
                            }
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="">All months</option>
                            {monthsForYear.map((month) => (
                                <option key={month} value={String(month)}>
                                    {MONTH_LABELS[month - 1] || month}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>
            )}
        </>
    );
}
