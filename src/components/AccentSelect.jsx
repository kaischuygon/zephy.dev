import { useEffect, useId, useRef, useState } from "react";
import { BiSolidPalette } from "react-icons/bi";
import accentColors from "../content/accent-colors.json";

export default function AccentSelect() {
    // default to 'daily' so the <select> is controlled from the start
    const [accentColor, setAccentColor] = useState("daily");

    const today = new Date();
    const dailyAccentColor =
        accentColors[today.getDate() % accentColors.length];

    useEffect(() => {
        // load the color from local storage with a safe guard
        let selected = null;
        try {
            selected = localStorage.getItem("accent");
        } catch (e) {
            // localStorage unavailable (e.g. privacy mode) — fall back to daily
            selected = null;
        }

        if (!selected) {
            setAccentColor("daily");
        } else if (selected === "daily" || accentColors.includes(selected)) {
            setAccentColor(selected);
        } else {
            // invalid value in localStorage: fall back to daily
            setAccentColor("daily");
        }
    }, []);

    useEffect(() => {
        try {
            if (accentColor === "daily") {
                // Persist the choice and apply the computed daily color
                localStorage.setItem("accent", "daily");
                document.documentElement.dataset["theme"] = dailyAccentColor;
            } else {
                // Only persist/apply if it's a known color
                if (accentColors.includes(accentColor)) {
                    localStorage.setItem("accent", accentColor);
                    document.documentElement.dataset["theme"] = accentColor;
                } else {
                    // unknown value — fall back to daily
                    localStorage.setItem("accent", "daily");
                    document.documentElement.dataset["theme"] =
                        dailyAccentColor;
                    setAccentColor("daily");
                }
            }
        } catch (e) {
            // localStorage or document access could fail; apply theme only if possible
            try {
                if (accentColor === "daily") {
                    document.documentElement.dataset["theme"] =
                        dailyAccentColor;
                } else if (accentColors.includes(accentColor)) {
                    document.documentElement.dataset["theme"] = accentColor;
                }
            } catch (err) {
                // nothing we can do in this environment
            }
        }
    }, [accentColor]);

    const selectId = useId("accentSelect");
    const selectRef = useRef();

    return (
        <label
            htmlFor={selectId}
            className="clickable btn flex cursor-pointer items-center gap-1 p-1"
            onClick={() => selectRef.current?.showPicker()}
        >
            <BiSolidPalette />
            <span hidden>accent</span>
            <select
                id={selectId}
                ref={selectRef}
                title="set accent color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
            >
                <option value="daily">daily</option>
                {accentColors.map((color) => (
                    <option key={color} value={color}>
                        {color}
                    </option>
                ))}
            </select>
        </label>
    );
}
