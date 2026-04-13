export type UiTheme = "dark" | "light";

const STORAGE_KEY = "ui_theme_v1";

export function getUiTheme(): UiTheme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" ? "light" : "dark";
}

export function applyUiThemeToDocument(theme: UiTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("theme-light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("theme-light");
    root.classList.add("dark");
  }
}

export function setUiTheme(theme: UiTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyUiThemeToDocument(theme);
  window.dispatchEvent(new Event("ui-theme-updated"));
}

export function toggleUiTheme() {
  const current = getUiTheme();
  setUiTheme(current === "light" ? "dark" : "light");
}

