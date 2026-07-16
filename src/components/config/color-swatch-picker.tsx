"use client";

import { useMemo } from "react";
import { generateThemeSwatches } from "@/lib/color";

export function ColorSwatchPicker({
  colorPrincipal,
  value,
  onChange,
}: {
  colorPrincipal: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const swatches = useMemo(
    () => generateThemeSwatches(colorPrincipal, 8),
    [colorPrincipal],
  );
  const seleccionLibre = !swatches.some(
    (hex) => hex.toLowerCase() === value.toLowerCase(),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {swatches.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          className={`h-7 w-7 rounded-full border-2 transition-transform ${
            !seleccionLibre && value.toLowerCase() === hex.toLowerCase()
              ? "scale-110 border-slate-900 dark:border-white"
              : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: hex }}
        />
      ))}
      <label
        title="Color personalizado"
        className={`relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 ${
          seleccionLibre
            ? "scale-110 border-slate-900 dark:border-white"
            : "border-dashed border-slate-300 hover:scale-105 dark:border-slate-600"
        }`}
        style={seleccionLibre ? { backgroundColor: value } : undefined}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        {!seleccionLibre && (
          <span className="text-xs text-slate-400 dark:text-slate-500">+</span>
        )}
      </label>
    </div>
  );
}
