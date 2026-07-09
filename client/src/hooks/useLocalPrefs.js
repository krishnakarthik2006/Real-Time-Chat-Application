/**
 * Thin wrapper around localStorage for per-key preferences.
 * Returns [value, setter] exactly like useState.
 */
import { useCallback, useState } from "react";

export function useLocalPref(key, defaultValue) {
  const [value, setInternalValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback((next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
    } catch { /* quota exceeded */ }
    setInternalValue(resolved);
  }, [key, value]);

  return [value, setValue];
}
