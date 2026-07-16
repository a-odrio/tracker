"use client";

import type { ColorPaletaItem } from "@/lib/types";

export function ColorSwatchPicker({
  paleta,
  value,
  onChange,
}: {
  paleta: ColorPaletaItem[];
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {paleta.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.nombre}
          onClick={() => onChange(c.valorHex)}
          className={`h-7 w-7 rounded-full border-2 transition-transform ${
            value === c.valorHex
              ? "scale-110 border-slate-900 dark:border-white"
              : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: c.valorHex }}
        />
      ))}
      {paleta.length === 0 && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Agregá colores a la paleta primero.
        </span>
      )}
    </div>
  );
}
