import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readStoredValue("chat-theme", "light"));
  const [accent, setAccent] = useState(() => readStoredValue("chat-accent", "indigo"));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem("chat-theme", theme);
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }

    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem("chat-accent", accent);
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }

    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  const value = useMemo(() => ({ theme, setTheme, accent, setAccent }), [theme, accent]);

  return (
    <ThemeContext.Provider value={value}>
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
