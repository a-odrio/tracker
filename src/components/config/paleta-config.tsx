"use client";

import { useState } from "react";
import { apiDelete, apiPost } from "@/lib/api-client";
import type { ColorPaletaItem } from "@/lib/types";
import { Button, ErrorText, Input, Section } from "@/components/ui";

export function PaletaConfig({
  paleta,
  onChange,
}: {
  paleta: ColorPaletaItem[];
  onChange: (paleta: ColorPaletaItem[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState("#3b82f6");
  const [error, setError] = useState("");

  async function agregar() {
    setError("");
    try {
      const color = await apiPost<ColorPaletaItem>("/api/paleta", {
        nombre,
        valorHex: hex,
      });
      onChange([...paleta, color]);
      setNombre("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function eliminar(id: number) {
    setError("");
    try {
      await apiDelete(`/api/paleta/${id}`);
      onChange(paleta.filter((c) => c.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Section title="Paleta de colores">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Estos son los colores disponibles para identificar Clientes, Proyectos y
        Estados en toda la app.
      </p>
      <div className="mb-4 flex flex-wrap gap-3">
        {paleta.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 dark:border-slate-700"
          >
            <span
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: c.valorHex }}
            />
            <span className="text-sm text-slate-700 dark:text-slate-200">
              {c.nombre}
            </span>
            <button
              onClick={() => eliminar(c.id)}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              title="Eliminar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Nombre
          </label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Turquesa"
            className="w-40"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Color
          </label>
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-8 w-14 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
          />
        </div>
        <Button onClick={agregar} disabled={!nombre}>
          Agregar color
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}
