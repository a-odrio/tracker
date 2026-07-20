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
import type { EstadoItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { SortableRow } from "@/components/config/sortable-row";
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordenados.findIndex((e) => e.id === active.id);
    const newIndex = ordenados.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordenados = arrayMove(ordenados, oldIndex, newIndex);
    onChange(estados.map((e) => {
      const nuevoIndex = reordenados.findIndex((r) => r.id === e.id);
      return nuevoIndex === -1 ? e : { ...e, orden: nuevoIndex };
    }));
    await Promise.all(
      reordenados.map((estado, index) =>
        estado.orden === index
          ? Promise.resolve()
          : apiPatch<EstadoItem>(`/api/estados/${estado.id}`, { orden: index }),
      ),
    );
  }

  return (
    <Section title="Estados (columnas del Kanban)">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        El orden acá define el orden de las columnas en el tablero Kanban.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={ordenados.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
            {ordenados.map((estado) => (
              <SortableRow key={estado.id} id={estado.id}>
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: estado.color }}
                />
                <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
                  {estado.nombre}
                </span>
                <button
                  onClick={() => eliminar(estado.id)}
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
