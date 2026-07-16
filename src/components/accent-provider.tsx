"use client";

import { useEffect } from "react";
import { apiGet } from "@/lib/api-client";
import type { ColorPaletaItem } from "@/lib/types";

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function contrastForeground(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [rr, gg, bb] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  return luminance > 0.45 ? "#0f172a" : "#ffffff";
}

export function AccentProvider() {
  useEffect(() => {
    apiGet<ColorPaletaItem[]>("/api/paleta")
      .then((paleta) => {
        if (paleta.length === 0) return;
        const ordenada = [...paleta].sort((a, b) => a.orden - b.orden);
        const principal =
          paleta.find((c) => c.principal)?.valorHex ?? ordenada[0].valorHex;
        const secundario =
          paleta.find((c) => c.secundario)?.valorHex ??
          ordenada[1]?.valorHex ??
          principal;

        const root = document.documentElement.style;
        root.setProperty("--accent-primary", principal);
        root.setProperty("--accent-primary-fg", contrastForeground(principal));
        root.setProperty("--accent-secondary", secundario);
        root.setProperty("--accent-secondary-fg", contrastForeground(secundario));
      })
      .catch(() => {
        // Keep the CSS fallback defaults from globals.css if this fails.
      });
  }, []);

  return null;
}
