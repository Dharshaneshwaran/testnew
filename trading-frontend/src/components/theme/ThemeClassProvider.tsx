"use client";

import { useEffect } from "react";

import { applyUiThemeToDocument, getUiTheme } from "@/lib/uiTheme";

export function ThemeClassProvider() {
  useEffect(() => {
    function refresh() {
      applyUiThemeToDocument(getUiTheme());
    }

    refresh();

    const onUpdate = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "ui_theme_v1") {
        refresh();
      }
    };

    window.addEventListener("ui-theme-updated", onUpdate);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("ui-theme-updated", onUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}

