/** Hell/Dunkel: Wahl liegt als `data-theme` auf dem d6-Wurzelelement, die Farben in app/d6/theme.css. */
export type Theme = "light" | "dark";

export const ROOT_ID = "d6-root";
const STORAGE_KEY = "preposaurus-d6-theme";
const DEFAULT_THEME: Theme = "light";
const THEMING_CLASS = "d6-theming";
const FADE_MS = 650;

/** Läuft beim HTML-Parsen, also vor dem ersten Paint: gespeicherte Wahl, sonst hell (Standard). */
export const THEME_BOOT_SCRIPT = `(function(){var r=document.getElementById(${JSON.stringify(ROOT_ID)});if(!r)return;var t=null;try{t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark")t=${JSON.stringify(DEFAULT_THEME)};r.setAttribute("data-theme",t)})()`;

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

/** Gespeicherte Wahl, sonst der helle Standard. */
export function initialTheme(): Theme {
  return storedTheme() ?? DEFAULT_THEME;
}

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Speicher gesperrt (z. B. privates Fenster): Wahl gilt dann nur bis zum Neuladen.
  }
}

export function currentTheme(): Theme {
  return document.getElementById(ROOT_ID)?.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** Setzt das Schema; mit `fade` blenden alle Farben kurz weich über. */
export function applyTheme(theme: Theme, fade: boolean) {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  if (fade) {
    root.classList.add(THEMING_CLASS);
    window.setTimeout(() => root.classList.remove(THEMING_CLASS), FADE_MS);
  }
  root.setAttribute("data-theme", theme);
}
