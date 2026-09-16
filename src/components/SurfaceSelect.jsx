import { useEffect, useId, useRef, useState } from "react";
import { BiSolidLayer } from "react-icons/bi";
import surfaceColors from "../content/surface-colors.json";

export default function SurfaceSelect({ locked = false } = {}) {
    const DEFAULT = "mist";
    // start with default so the <select> is controlled from the start
    const [surfaceColor, setSurfaceColor] = useState(DEFAULT);

    useEffect(() => {
        // load the color from local storage with a safe guard
        let selected = null;
        try {
            selected = localStorage.getItem("surface");
        } catch (e) {
            // localStorage unavailable (e.g. privacy mode) — fall back to default
            selected = null;
        }

        if (!selected) {
            setSurfaceColor(DEFAULT);
        } else if (selected === DEFAULT || surfaceColors.includes(selected)) {
            setSurfaceColor(selected);
        } else {
            // invalid value in localStorage: fall back to default
            setSurfaceColor(DEFAULT);
        }
    }, []);

    useEffect(() => {
        try {
            if (surfaceColor === DEFAULT) {
                // Persist the choice and apply the default
                localStorage.setItem("surface", DEFAULT);
                document.documentElement.dataset["surface"] = DEFAULT;
            } else {
                // Only persist/apply if it's a known color
                if (surfaceColors.includes(surfaceColor)) {
                    localStorage.setItem("surface", surfaceColor);
                    document.documentElement.dataset["surface"] = surfaceColor;
                } else {
                    // unknown value — fall back to default
                    localStorage.setItem("surface", DEFAULT);
                    document.documentElement.dataset["surface"] = DEFAULT;
                    setSurfaceColor(DEFAULT);
                }
            }
        } catch (e) {
            // localStorage or document access could fail; apply theme only if possible
            try {
                if (surfaceColor === DEFAULT) {
                    document.documentElement.dataset["surface"] = DEFAULT;
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
                {surfaceColors.map((color) => (
                    <option key={color} value={color}>
                        {color}
                    </option>
                ))}
            </select>
        </label>
    );
}
