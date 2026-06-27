import { useTheme } from "../theme/ThemeContext";

const ACCENTS = [
  { id: "indigo",  label: "Indigo" },
  { id: "rose",    label: "Rose" },
  { id: "emerald", label: "Emerald" },
  { id: "sky",     label: "Sky" },
  { id: "amber",   label: "Amber" },
];

export default function ThemeSelector() {
  const { theme, setTheme, accent, setAccent } = useTheme();

  return (
    <div className="theme-selector">
      <div className="theme-selector__row">
        <span>Theme</span>
        <div className="theme-selector__buttons">
          <button className={`theme-btn ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
            Light
          </button>
          <button className={`theme-btn ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
            Dark
          </button>
        </div>
      </div>
      <div className="theme-selector__row">
        <span>Accent</span>
        <div className="theme-selector__accents">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              className={`accent-btn accent-${a.id} ${accent === a.id ? "active" : ""}`}
              onClick={() => setAccent(a.id)}
              title={a.label}
              aria-label={`${a.label} accent`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
