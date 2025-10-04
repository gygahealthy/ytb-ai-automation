import { create } from "zustand";

export type Theme = "light" | "dark";
export type ColorScheme = "blue" | "purple" | "green" | "orange" | "red" | "pink" | "teal" | "indigo";
export type FontSize = "xs" | "sm" | "md" | "lg";

interface SettingsState {
  theme: Theme;
  colorScheme: ColorScheme;
  compactMode: boolean;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setCompactMode: (compact: boolean) => void;
  setFontSize: (size: FontSize) => void;
}

// Simple store without persist for now
export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "light",
  colorScheme: "green",
  compactMode: false,
  fontSize: "md",
  setTheme: (theme) => {
    set({ theme });
    // Apply theme immediately
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save to localStorage
    localStorage.setItem("veo3-theme", theme);
  },
  setColorScheme: (colorScheme) => {
    set({ colorScheme });
    // Apply color scheme immediately
    document.documentElement.setAttribute("data-theme", colorScheme);
    // Save to localStorage
    localStorage.setItem("veo3-color-scheme", colorScheme);
  },
  setCompactMode: (compactMode) => {
    set({ compactMode });
    // Apply compact mode immediately
    if (compactMode) {
      document.documentElement.classList.add("compact");
    } else {
      document.documentElement.classList.remove("compact");
    }
    // Save to localStorage
    localStorage.setItem("veo3-compact-mode", JSON.stringify(compactMode));
  },
  setFontSize: (fontSize) => {
    set({ fontSize });
    // Apply font size immediately
    document.documentElement.setAttribute("data-font-size", fontSize);
    // Save to localStorage
    localStorage.setItem("veo3-font-size", fontSize);
  },
}));

// Initialize settings from localStorage
const savedTheme = localStorage.getItem("veo3-theme") as Theme | null;
const savedColorScheme = localStorage.getItem("veo3-color-scheme") as ColorScheme | null;
const savedCompactMode = localStorage.getItem("veo3-compact-mode");
const savedFontSize = localStorage.getItem("veo3-font-size") as FontSize | null;

if (savedTheme) {
  useSettingsStore.getState().setTheme(savedTheme);
}
if (savedColorScheme) {
  useSettingsStore.getState().setColorScheme(savedColorScheme);
}
if (savedCompactMode !== null) {
  useSettingsStore.getState().setCompactMode(JSON.parse(savedCompactMode));
}
if (savedFontSize) {
  useSettingsStore.getState().setFontSize(savedFontSize);
}
