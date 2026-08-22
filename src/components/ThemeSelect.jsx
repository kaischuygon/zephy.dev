import { useEffect, useId, useRef, useState } from "react";
import { MdLightMode } from "react-icons/md";

export default function ThemeSelect() {
    const [theme, setTheme] = useState();
    const THEMES = ["system", "light", "dark"];

    useEffect(() => {
        if (localStorage.theme) {
            setTheme(localStorage.theme);
        }
    }, []);

    useEffect(() => {
        switch (theme) {
            case "system":
                localStorage.removeItem("theme");
                if (window.matchMedia("(prefers-color-scheme: dark)").matches)
                    document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
                break;
            case "light":
                document.documentElement.classList.remove("dark");
                localStorage.setItem("theme", "light");
                break;
            case "dark":
                document.documentElement.classList.add("dark");
                localStorage.setItem("theme", "dark");
                break;
        }
    }, [theme]);

    const selectId = useId("themeSelect");
    const selectRef = useRef();

    return (
        <label
            htmlFor={selectId}
            className="clickable shadow-square-clickable flex cursor-pointer items-center gap-1 border p-1"
            onClick={() => selectRef.current?.showPicker()}
        >
            <MdLightMode />
            <span hidden>theme</span>
            <select
                id={selectId}
                ref={selectRef}
                title="set theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
            >
                {THEMES.map((theme) => (
                    <option value={theme}>{theme}</option>
                ))}
            </select>
        </label>
    );
}
