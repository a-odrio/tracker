"use client";

import { useMemo, useState } from "react";
import { apiPatch } from "@/lib/api-client";
import { generateThemeSwatches } from "@/lib/color";
import type { TemaItem } from "@/lib/types";
import { ErrorText, Section } from "@/components/ui";

export function ColorPrincipalConfig({
  colorPrincipal,
  onChange,
}: {
  colorPrincipal: string;
  onChange: (colorPrincipal: string) => void;
}) {
  const [error, setError] = useState("");
  const swatches = useMemo(() => generateThemeSwatches(colorPrincipal, 8), [colorPrincipal]);

  async function guardar(hex: string) {
    setError("");
    try {
      const tema = await apiPatch<TemaItem>("/api/tema", { colorPrincipal: hex });
      onChange(tema.colorPrincipal);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Section title="Color principal">
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Define el color de acento de toda la app (botones, resaltados) y sirve de
        base para las opciones de color que se ofrecen al crear Clientes,
        Proyectos y Estados.
      </p>
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={colorPrincipal}
          onChange={(e) => guardar(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
        />
        <div>
          <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
            Opciones derivadas
          </div>
          <div className="flex gap-1.5">
            {swatches.map((hex) => (
              <span
                key={hex}
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}
