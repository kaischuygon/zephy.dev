import { useEffect, useState } from "react";

export default function AccentSelect() {
    const [ accentColor, setAccentColor ] = useState();

    const colorSchemes = [
        "red",
        "orange",
        "amber",
        "yellow",
        "lime",
        "green",
        "emerald",
        "teal",
        "cyan",
        "sky",
        "blue",
        "indigo",
        "violet",
        "purple",
        "fuchsia",
        "pink",
        "rose"
    ]

    const today = new Date();
    const dailyAccentColor = colorSchemes[today.getDate() % colorSchemes.length];

    useEffect(() => {
        // load the color from local storage
        
        const selected = localStorage.getItem('accent');
        if (!selected) {
            // if not set, set to daily
            setAccentColor('daily');
        } else {
            setAccentColor(selected);
        }
    }, []);

    useEffect(() => {
        if (accentColor === 'daily') {
            // Set the accent color to the daily color
            localStorage.setItem('accent', 'daily');
            document.documentElement.dataset['theme'] = dailyAccentColor;
        } else {
            localStorage.setItem('accent', accentColor);
            document.documentElement.dataset['theme'] = accentColor;
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