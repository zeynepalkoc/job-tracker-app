import { useEffect, useState } from "react";

const KEY = "job-tracker:theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem(KEY);
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
}
