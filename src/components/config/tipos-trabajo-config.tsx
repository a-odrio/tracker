"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type { TipoTrabajoItem } from "@/lib/types";
import { SortableRow } from "@/components/config/sortable-row";
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

  const ordenados = [...tipos].sort((a, b) => a.orden - b.orden);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordenados.findIndex((t) => t.id === active.id);
    const newIndex = ordenados.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordenados = arrayMove(ordenados, oldIndex, newIndex);
    onChange(tipos.map((t) => {
      const nuevoIndex = reordenados.findIndex((r) => r.id === t.id);
      return nuevoIndex === -1 ? t : { ...t, orden: nuevoIndex };
    }));
    await Promise.all(
      reordenados.map((tipo, index) =>
        tipo.orden === index
          ? Promise.resolve()
          : apiPatch<TipoTrabajoItem>(`/api/tipos-trabajo/${tipo.id}`, { orden: index }),
      ),
    );
  }

  return (
    <Section title="Tipos de trabajo">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={ordenados.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
            {ordenados.map((tipo) => (
              <SortableRow key={tipo.id} id={tipo.id}>
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
              </SortableRow>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
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
