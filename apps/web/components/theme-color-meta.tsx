"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_COLORS = {
  light: "#ffffff",
  dark: "#1a1a1a",
} as const;

function setThemeColor(theme: string | undefined) {
  const color =
    THEME_COLORS[theme as keyof typeof THEME_COLORS] ?? THEME_COLORS.light;

  // Remove ALL existing theme-color meta tags (including media-query variants)
  for (const el of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )) {
    el.remove();
  }

  // Create a single meta tag without media query
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = color;
  document.head.appendChild(meta);
}

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  // Sync theme-color when next-themes resolvedTheme changes
  useEffect(() => {
    setThemeColor(resolvedTheme);
  }, [resolvedTheme]);

  // Also listen to system prefers-color-scheme changes directly
  // as a fallback for standalone PWA mode
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setThemeColor(e.matches ? "dark" : "light");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return null;
}
