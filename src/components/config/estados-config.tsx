"use client";

import { useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type { EstadoItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { Button, ErrorText, Input, Section } from "@/components/ui";

export function EstadosConfig({
  estados,
  colorPrincipal,
  onChange,
}: {
  estados: EstadoItem[];
  colorPrincipal: string;
  onChange: (estados: EstadoItem[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(colorPrincipal);
  const [error, setError] = useState("");

  const ordenados = [...estados].sort((a, b) => a.orden - b.orden);

  async function agregar() {
    setError("");
    try {
      const estado = await apiPost<EstadoItem>("/api/estados", { nombre, color });
      onChange([...estados, estado]);
      setNombre("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function eliminar(id: number) {
    setError("");
    try {
      await apiDelete(`/api/estados/${id}`);
      onChange(estados.filter((e) => e.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function mover(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= ordenados.length) return;
    const a = ordenados[index];
    const b = ordenados[target];
    const [updatedA, updatedB] = await Promise.all([
      apiPatch<EstadoItem>(`/api/estados/${a.id}`, { orden: b.orden }),
      apiPatch<EstadoItem>(`/api/estados/${b.id}`, { orden: a.orden }),
    ]);
    onChange(
      estados.map((e) => {
        if (e.id === updatedA.id) return updatedA;
        if (e.id === updatedB.id) return updatedB;
        return e;
      }),
    );
  }

  return (
    <Section title="Estados (columnas del Kanban)">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        El orden acá define el orden de las columnas en el tablero Kanban.
      </p>
      <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
        {ordenados.map((estado, i) => (
          <li key={estado.id} className="flex items-center gap-3 py-2">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: estado.color }}
            />
            <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
              {estado.nombre}
            </span>
            <button
              onClick={() => mover(i, -1)}
              disabled={i === 0}
              className="text-slate-400 hover:text-slate-900 disabled:opacity-30 dark:hover:text-slate-100"
            >
              ↑
            </button>
            <button
              onClick={() => mover(i, 1)}
              disabled={i === ordenados.length - 1}
              className="text-slate-400 hover:text-slate-900 disabled:opacity-30 dark:hover:text-slate-100"
            >
              ↓
            </button>
            <button
              onClick={() => eliminar(estado.id)}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              title="Eliminar"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Nombre
          </label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: En espera"
            className="w-44"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Color
          </label>
          <ColorSwatchPicker
            colorPrincipal={colorPrincipal}
            value={color}
            onChange={setColor}
          />
        </div>
        <Button onClick={agregar} disabled={!nombre}>
          Agregar estado
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}
