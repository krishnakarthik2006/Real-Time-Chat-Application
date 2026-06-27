import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("chat-theme") || "light");
  const [accent, setAccent] = useState(() => localStorage.getItem("chat-accent") || "indigo");

  useEffect(() => {
    localStorage.setItem("chat-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("chat-accent", accent);
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
