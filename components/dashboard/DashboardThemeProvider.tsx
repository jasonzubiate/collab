"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";

export type DashboardTheme = "light" | "dark" | "system";

const STORAGE_KEY = "collab-dashboard-theme";
const THEME_EVENT = "collab-dashboard-theme-change";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(
  null,
);

function readStoredTheme(): DashboardTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function subscribeTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

function subscribePrefersDark(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function resolveTheme(theme: DashboardTheme, prefersDark: boolean): "light" | "dark" {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

export function DashboardThemeProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    (): DashboardTheme => "system",
  );

  const prefersDark = useSyncExternalStore(
    subscribePrefersDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

  const setTheme = useCallback((next: DashboardTheme) => {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const resolved = resolveTheme(theme, prefersDark);
  const isDark = resolved === "dark";

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <DashboardThemeContext.Provider value={value}>
      <div className={cn("min-h-dvh bg-background", isDark && "dark", className)}>
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return context;
}
