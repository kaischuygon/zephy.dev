import { useEffect, useId, useRef, useState } from "react";
import { BiSolidLayer } from "react-icons/bi";
import surfaceColors from "../content/surface-colors.json";

export default function SurfaceSelect({ locked = false } = {}) {
    // default to 'daily' so the <select> is controlled from the start
    const [surfaceColor, setSurfaceColor] = useState("daily");

    const today = new Date();
    const dailySurfaceColor =
        surfaceColors[today.getDate() % surfaceColors.length];

    useEffect(() => {
        // load the color from local storage with a safe guard
        let selected = null;
        try {
            selected = localStorage.getItem("surface");
        } catch (e) {
            // localStorage unavailable (e.g. privacy mode) — fall back to daily
            selected = null;
        }

        if (!selected) {
            setSurfaceColor("daily");
        } else if (selected === "daily" || surfaceColors.includes(selected)) {
            setSurfaceColor(selected);
        } else {
            // invalid value in localStorage: fall back to daily
            setSurfaceColor("daily");
        }
    }, []);

    useEffect(() => {
        try {
            if (surfaceColor === "daily") {
                // Persist the choice and apply the computed daily color
                localStorage.setItem("surface", "daily");
                document.documentElement.dataset["surface"] = dailySurfaceColor;
            } else {
                // Only persist/apply if it's a known color
                if (surfaceColors.includes(surfaceColor)) {
                    localStorage.setItem("surface", surfaceColor);
                    document.documentElement.dataset["surface"] = surfaceColor;
                } else {
                    // unknown value — fall back to daily
                    localStorage.setItem("surface", "daily");
                    document.documentElement.dataset["surface"] =
                        dailySurfaceColor;
                    setSurfaceColor("daily");
                }
            }
        } catch (e) {
            // localStorage or document access could fail; apply theme only if possible
            try {
                if (surfaceColor === "daily") {
                    document.documentElement.dataset["surface"] =
                        dailySurfaceColor;
                } else if (surfaceColors.includes(surfaceColor)) {
                    document.documentElement.dataset["surface"] = surfaceColor;
                }
            } catch (err) {
                // nothing we can do in this environment
            }
        }
    }, [surfaceColor]);

    const selectId = useId("surfaceSelect");
    const selectRef = useRef();

    // Recipe pages force their own surface (data-surface="taupe" on <body>,
    // see Layout.astro/theme-recipes.css) regardless of what's picked here
    // — so on those pages, show the picker as locked to that value instead
    // of letting it look "live" while actually doing nothing. This is
    // purely a display/interaction override: the real saved preference
    // (surfaceColor state, localStorage, and <html>'s dataset) is left
    // alone so it's back in effect the moment you leave a recipe page.
    const displayedValue = locked ? "taupe" : surfaceColor;

    return (
        <label
            htmlFor={selectId}
            title={locked ? "locked to the recipes theme" : undefined}
            className={`clickable btn flex items-center gap-1 p-1 ${locked ? "cursor-not-allowed grayscale" : "cursor-pointer"}`}
            onClick={() => !locked && selectRef.current?.showPicker()}
        >
            <BiSolidLayer />
            <span hidden>surface</span>
            <select
                id={selectId}
                ref={selectRef}
                title={
                    locked
                        ? "surface color is locked to the recipes theme"
                        : "set surface color"
                }
                value={displayedValue}
                disabled={locked}
                onChange={(e) => setSurfaceColor(e.target.value)}
            >
                <option value="daily">daily</option>
                {surfaceColors.map((color) => (
                    <option key={color} value={color}>
                        {color}
                    </option>
                ))}
            </select>
        </label>
    );
}
