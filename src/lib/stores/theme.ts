import { writable, get } from "svelte/store";
import { themeState } from "fractalthemer";

export type ThemeMode = "light" | "dark";

const DEFAULT_THEME_BY_MODE: Record<ThemeMode, string> = {
  light: "theme-light-default",
  dark: "theme-night-dark",
};

export const themeMode = writable<ThemeMode>("light");
let initialized = false;

function applyLegacyMode(mode: ThemeMode): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;
  root.classList.toggle("dark", mode === "dark");
}

export function getEffectiveTheme(): ThemeMode {
  return get(themeMode);
}

export function applyCurrentTheme(): void {
  const mode = get(themeMode);
  applyLegacyMode(mode);
  if (initialized) themeState.setTheme(DEFAULT_THEME_BY_MODE[mode]);
}

export function initThemeListener(): void {
  themeState.init();
  const mode: ThemeMode = themeState.isDark ? "dark" : "light";
  themeMode.set(mode);
  initialized = true;
  applyLegacyMode(mode);

  themeMode.subscribe((next) => {
    applyLegacyMode(next);
    if (initialized) themeState.setTheme(DEFAULT_THEME_BY_MODE[next]);
  });
}

export function cycleTheme(current: ThemeMode): ThemeMode {
  return current === "dark" ? "light" : "dark";
}
