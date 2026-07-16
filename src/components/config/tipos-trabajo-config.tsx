"use client";

import { useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type { TipoTrabajoItem } from "@/lib/types";
import { Button, ErrorText, Input, Section } from "@/components/ui";

export function TiposTrabajoConfig({
  tipos,
  onChange,
}: {
  tipos: TipoTrabajoItem[];
  onChange: (tipos: TipoTrabajoItem[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  async function agregar() {
    setError("");
    try {
      const tipo = await apiPost<TipoTrabajoItem>("/api/tipos-trabajo", { nombre });
      onChange([...tipos, tipo]);
      setNombre("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleActivo(tipo: TipoTrabajoItem) {
    const actualizado = await apiPatch<TipoTrabajoItem>(
      `/api/tipos-trabajo/${tipo.id}`,
      { activo: !tipo.activo },
    );
    onChange(tipos.map((t) => (t.id === tipo.id ? actualizado : t)));
  }

  async function eliminar(id: number) {
    setError("");
    try {
      await apiDelete(`/api/tipos-trabajo/${id}`);
      onChange(tipos.filter((t) => t.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Section title="Tipos de trabajo">
      <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
        {tipos.map((tipo) => (
          <li key={tipo.id} className="flex items-center gap-3 py-2">
            <span
              className={`flex-1 text-sm ${tipo.activo ? "text-slate-800 dark:text-slate-200" : "text-slate-400 line-through dark:text-slate-600"}`}
            >
              {tipo.nombre}
            </span>
            <button
              onClick={() => toggleActivo(tipo)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              {tipo.activo ? "Desactivar" : "Activar"}
            </button>
            <button
              onClick={() => eliminar(tipo.id)}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              title="Eliminar"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Nombre
          </label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Soporte"
            className="w-44"
          />
        </div>
        <Button onClick={agregar} disabled={!nombre}>
          Agregar tipo
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}
