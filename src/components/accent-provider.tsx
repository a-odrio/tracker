"use client";

import { useEffect } from "react";
import { apiGet } from "@/lib/api-client";
import { contrastForeground } from "@/lib/color";
import type { TemaItem } from "@/lib/types";

export function AccentProvider() {
  useEffect(() => {
    apiGet<TemaItem>("/api/tema")
      .then((tema) => {
        const root = document.documentElement.style;
        root.setProperty("--accent-primary", tema.colorPrincipal);
        root.setProperty(
          "--accent-primary-fg",
          contrastForeground(tema.colorPrincipal),
        );
      })
      .catch(() => {
        // Keep the CSS fallback defaults from globals.css if this fails.
      });
  }, []);

  return null;
}
