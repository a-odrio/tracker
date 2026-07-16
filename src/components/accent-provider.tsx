"use client";

import { useEffect } from "react";
import { apiGet } from "@/lib/api-client";
import { applyAccentColor } from "@/lib/color";
import type { TemaItem } from "@/lib/types";

export function AccentProvider() {
  useEffect(() => {
    apiGet<TemaItem>("/api/tema")
      .then((tema) => applyAccentColor(tema.colorPrincipal))
      .catch(() => {
        // Keep the CSS fallback defaults from globals.css if this fails.
      });
  }, []);

  return null;
}
