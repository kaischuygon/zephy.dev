import { useEffect, useState } from "react";
import colorSchemes from "../content/color-schemes.json";

export default function AccentSelect() {
    // default to 'daily' so the <select> is controlled from the start
    const [accentColor, setAccentColor] = useState('daily');

    const today = new Date();
    const dailyAccentColor = colorSchemes[today.getDate() % colorSchemes.length];

    useEffect(() => {
        // load the color from local storage with a safe guard
        let selected = null;
        try {
            selected = localStorage.getItem('accent');
        } catch (e) {
            // localStorage unavailable (e.g. privacy mode) — fall back to daily
            selected = null;
        }

        if (!selected) {
            setAccentColor('daily');
        } else if (selected === 'daily' || colorSchemes.includes(selected)) {
            setAccentColor(selected);
        } else {
            // invalid value in localStorage: fall back to daily
            setAccentColor('daily');
        }
    }, []);

    useEffect(() => {
        try {
            if (accentColor === 'daily') {
                // Persist the choice and apply the computed daily color
                localStorage.setItem('accent', 'daily');
                document.documentElement.dataset['theme'] = dailyAccentColor;
            } else {
                // Only persist/apply if it's a known color
                if (colorSchemes.includes(accentColor)) {
                    localStorage.setItem('accent', accentColor);
                    document.documentElement.dataset['theme'] = accentColor;
                } else {
                    // unknown value — fall back to daily
                    localStorage.setItem('accent', 'daily');
                    document.documentElement.dataset['theme'] = dailyAccentColor;
                    setAccentColor('daily');
                }
            }
        } catch (e) {
            // localStorage or document access could fail; apply theme only if possible
            try {
                if (accentColor === 'daily') {
                    document.documentElement.dataset['theme'] = dailyAccentColor;
                } else if (colorSchemes.includes(accentColor)) {
                    document.documentElement.dataset['theme'] = accentColor;
                }
            } catch (err) {
                // nothing we can do in this environment
            }
        }
    }, [accentColor]);


    return (
        <select
            id="accentSelect"
            title="set accent color"
            aria-hidden="true"
            value={accentColor}
            onChange={e => setAccentColor(e.target.value)}
        >
            <option value="daily">daily</option>
            <hr />
            {colorSchemes.map((color) => <option key={color} value={color}>{color}</option>)}
        </select>
    )
}