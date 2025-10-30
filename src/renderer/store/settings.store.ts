import { create } from "zustand";
import { generateUuid } from "@/core/id";

export type Theme = "light" | "dark";
export type ColorScheme = "blue" | "purple" | "green" | "orange" | "red" | "pink" | "teal" | "indigo";
export type FontSize = "xs" | "sm" | "md" | "lg";

export interface BrowserPath {
  id: string;
  name: string;
  path: string;
  isDefault: boolean;
  note?: string;
}

interface SettingsState {
  theme: Theme;
  colorScheme: ColorScheme;
  compactMode: boolean;
  fontSize: FontSize;
  browserPaths: BrowserPath[];
  streamingEnabled: boolean;
  // Visibility of settings sections
  visibleSections?: Record<string, boolean>;
  setVisibleSection?: (section: string, visible: boolean) => void;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setCompactMode: (compact: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setStreamingEnabled: (enabled: boolean) => void;
  addBrowserPath: (bp: Omit<BrowserPath, "id">) => void;
  updateBrowserPath: (id: string, partial: Partial<BrowserPath>) => void;
  removeBrowserPath: (id: string) => void;
  setDefaultBrowserPath: (id: string) => void;
  getDefaultBrowserPath: () => BrowserPath | undefined;
}

// Simple store without persist for now
export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "light",
  colorScheme: "green",
  compactMode: false,
  fontSize: "md",
  browserPaths: [],
  streamingEnabled: true,
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
  setStreamingEnabled: (enabled) => {
    set({ streamingEnabled: enabled });
    // Save to localStorage
    localStorage.setItem("veo3-streaming-enabled", JSON.stringify(enabled));
  },
  addBrowserPath: (bp) => {
    const id = generateUuid();
    const currentPaths = get().browserPaths;
    const hasDefault = currentPaths.some((p) => p.isDefault);
    const newPath: BrowserPath = {
      ...bp,
      id,
      isDefault: hasDefault ? false : true, // First one is default
    };
    const updated = [...currentPaths, newPath];
    set({ browserPaths: updated });
    localStorage.setItem("veo3-browser-paths", JSON.stringify(updated));
  },
  updateBrowserPath: (id, partial) => {
    const updated = get().browserPaths.map((bp) => (bp.id === id ? { ...bp, ...partial } : bp));
    set({ browserPaths: updated });
    localStorage.setItem("veo3-browser-paths", JSON.stringify(updated));
  },
  removeBrowserPath: (id) => {
    const currentPaths = get().browserPaths;
    const toRemove = currentPaths.find((bp) => bp.id === id);
    const updated = currentPaths.filter((bp) => bp.id !== id);

    // If we removed the default, set first remaining as default
    if (toRemove?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }

    set({ browserPaths: updated });
    localStorage.setItem("veo3-browser-paths", JSON.stringify(updated));
  },
  setDefaultBrowserPath: (id) => {
    const updated = get().browserPaths.map((bp) => ({
      ...bp,
      isDefault: bp.id === id,
    }));
    set({ browserPaths: updated });
    localStorage.setItem("veo3-browser-paths", JSON.stringify(updated));
  },
  getDefaultBrowserPath: () => {
    return get().browserPaths.find((bp) => bp.isDefault);
  },
  // Visibility defaults will be hydrated below if stored
  visibleSections: undefined,
  setVisibleSection: (section: string, visible: boolean) => {
    const current = get().visibleSections || {
      general: true,
      browsers: true,
      keyboard: true,
      filePaths: true,
    };
    const updated = { ...current, [section]: visible };
    set({ visibleSections: updated });
    localStorage.setItem("veo3-visible-sections", JSON.stringify(updated));
  },
}));

// Initialize settings from localStorage
const savedTheme = localStorage.getItem("veo3-theme") as Theme | null;
const savedColorScheme = localStorage.getItem("veo3-color-scheme") as ColorScheme | null;
const savedCompactMode = localStorage.getItem("veo3-compact-mode");
const savedFontSize = localStorage.getItem("veo3-font-size") as FontSize | null;
const savedBrowserPaths = localStorage.getItem("veo3-browser-paths");
const savedStreamingEnabled = localStorage.getItem("veo3-streaming-enabled");

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
if (savedStreamingEnabled !== null) {
  useSettingsStore.getState().setStreamingEnabled(JSON.parse(savedStreamingEnabled));
}
if (savedBrowserPaths) {
  try {
    const parsed = JSON.parse(savedBrowserPaths) as BrowserPath[];
    useSettingsStore.setState({ browserPaths: parsed });
  } catch (e) {
    console.error("Failed to parse saved browser paths", e);
  }
}
// Hydrate visibleSections with per-section keys (including filePaths subsections)
const savedVisible = localStorage.getItem("veo3-visible-sections");
const defaultVisible = {
  general: true,
  browsers: true,
  keyboard: true,
  filePaths: true,
  flowVeo3: true,
  "filePaths.defaultLocations": true,
  "filePaths.fileNaming": true,
  "filePaths.folderNaming": true,
};
if (savedVisible) {
  try {
    const parsed = JSON.parse(savedVisible);
    useSettingsStore.setState({
      visibleSections: { ...defaultVisible, ...parsed },
    });
  } catch (e) {
    console.error("Failed to parse saved visible sections", e);
    useSettingsStore.setState({ visibleSections: defaultVisible });
  }
} else {
  useSettingsStore.setState({ visibleSections: defaultVisible });
}
