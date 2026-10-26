import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const listeners = new Set<() => void>();
const media = window.matchMedia("(prefers-color-scheme: dark)");

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // storage blocked – fall back to system
  }
  return "system";
}

let preference = readPreference();

function apply() {
  const dark = preference === "dark" || (preference === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
}

media.addEventListener("change", () => {
  if (preference === "system") {
    apply();
    listeners.forEach((l) => l());
  }
});

export function setTheme(next: ThemePreference) {
  preference = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // ignore
  }
  apply();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => preference);
  const isDark = pref === "dark" || (pref === "system" && media.matches);
  return { preference: pref, isDark, setTheme };
}
