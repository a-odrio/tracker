"use client";

import { useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
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

  async function marcarRol(id: number, rol: "principal" | "secundario") {
    setError("");
    try {
      const actualizado = await apiPatch<ColorPaletaItem>(`/api/paleta/${id}`, {
        [rol]: true,
      });
      onChange(
        paleta.map((c) => {
          if (c.id === actualizado.id) return actualizado;
          return { ...c, [rol]: false };
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Section title="Paleta de colores">
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Estos colores se usan para identificar Clientes, Proyectos y Estados, y
        también definen el color de acento de toda la app. Marcá cuál es el{" "}
        <strong>principal</strong> (botones, resaltados) y cuál el{" "}
        <strong>secundario</strong>.
      </p>
      <div className="mb-4 space-y-2">
        {paleta.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 py-1.5 pl-2 pr-3 dark:border-slate-700"
          >
            <span
              className="h-5 w-5 shrink-0 rounded-full"
              style={{ backgroundColor: c.valorHex }}
            />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
              {c.nombre}
            </span>
            <button
              onClick={() => marcarRol(c.id, "principal")}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                c.principal
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              Principal
            </button>
            <button
              onClick={() => marcarRol(c.id, "secundario")}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                c.secundario
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              Secundario
            </button>
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
