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
        "rose",
        "slate",
        "gray",
        "zinc",
        "neutral",
        "stone"
    ]

    const today = new Date();
    const dailyAccentColor = colorSchemes[today.getDate() % colorSchemes.length];
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    useEffect(() => {
        console.log(dailyAccentColor);
        if (!localStorage.getItem('accent')) {
            localStorage.setItem('accent', 'daily');
            shades.forEach((shade) => {
                document.documentElement.style.setProperty(
                    `--color-accent-${shade}`,
                    `var(--color-${dailyAccentColor}-${shade})`,
                );
            });
            setAccentColor('daily');
        } else {
            // load the color from local storage
            const selected = localStorage.getItem('accent');
            if (selected === 'daily') {
                shades.forEach((shade) => {
                    document.documentElement.style.setProperty(
                        `--color-accent-${shade}`,
                        `var(--color-${dailyAccentColor}-${shade})`,
                    );
                });
            } else {
                shades.forEach((shade) => {
                    document.documentElement.style.setProperty(
                        `--color-accent-${shade}`,
                        `var(--color-${selected}-${shade})`,
                    );
                });
            }
            setAccentColor(selected);
        }
    }, []);

    useEffect(() => {
        console.log(accentColor);

        if (accentColor === "daily") {
            // Set the accent color to the daily color
            shades.forEach((shade) => {
                document.documentElement.style.setProperty(
                    `--color-accent-${shade}`,
                    `var(--color-${dailyAccentColor}-${shade})`,
                );
            });
        } else {
            shades.forEach((shade) => {
                document.documentElement.style.setProperty(
                    `--color-accent-${shade}`,
                    `var(--color-${accentColor}-${shade})`,
                );
            });
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