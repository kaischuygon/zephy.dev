import { useEffect, useState } from "react";

export default function ThemeSelect() {
    const [theme, setTheme] = useState();

    useEffect(() => {
        if(localStorage.theme) {
            setTheme(localStorage.theme);
        }
    }, []);

    useEffect(() => {
        switch(theme) {
            case 'system':
                localStorage.removeItem('theme');
                if(window.matchMedia("(prefers-color-scheme: dark)").matches)
                    document.documentElement.classList.add('dark');
                else
                    document.documentElement.classList.remove('dark');
                break;
            case 'light':
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                break;
            case 'dark':
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                break;
        }
    }, [theme]);
    
    return (
        <select
            id="themeSelect"
            title="set theme"
            aria-hidden="true"
            value={theme}
            onChange={e => setTheme(e.target.value)}
        >
            <option value="system">system</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
        </select>
    )
}
