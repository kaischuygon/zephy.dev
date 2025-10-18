import { useEffect, useState } from "react";

export default function ThemeSelect() {
    const [theme, setTheme] = useState("");

    useEffect(() => {
        if(localStorage.theme) {
            setTheme(localStorage.theme);
        }
    }, []);

    useEffect(() => {
        if(theme === "system") {
            localStorage.removeItem("theme");
        } else {
            localStorage.setItem("theme", theme);
        }
        
        // Toggle the dark class on the document element based on the selected theme
        const element = document.documentElement;
        element.classList.toggle(
            "dark",
            theme === "dark" || (
                !("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches
            )
        );
    }, [theme])
    
    return (
        <select
            id="themeSelect"
            className="shadow-square hover:shadow-square-2 border p-1"
            title="set theme"
            value={theme}
            onChange={e => setTheme(e.target.value)}
        >
            <option value="system">system</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
        </select>
    )
}