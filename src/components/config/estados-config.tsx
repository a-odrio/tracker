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
import { Lock } from "lucide-react";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type { EstadoItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { SortableRow } from "@/components/config/sortable-row";
import { Button, ErrorText, Input, Section } from "@/components/ui";

function EstadoRowContent({
  estado,
  onToggleBacklog,
  onEliminar,
}: {
  estado: EstadoItem;
  onToggleBacklog: () => void;
  onEliminar?: () => void;
}) {
  return (
    <>
      <span
        className="h-4 w-4 shrink-0 rounded-full"
        style={{ backgroundColor: estado.color }}
      />
      <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
        {estado.nombre}
      </span>
      {estado.esInicial && (
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Inicial
        </span>
      )}
      {estado.esFinal && (
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Final
        </span>
      )}
      <label
        className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
        title="Si está tildado, las tareas en este estado aparecen en el backlog de Planificación semanal"
      >
        <input
          type="checkbox"
          checked={estado.mostrarEnBacklog}
          onChange={onToggleBacklog}
          className="rounded border-slate-300 dark:border-slate-600"
        />
        Backlog
      </label>
      {onEliminar ? (
        <button
          onClick={onEliminar}
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          title="Eliminar"
        >
          ×
        </button>
      ) : (
        <span
          className="text-slate-300 dark:text-slate-600"
          title="El estado inicial y el final son fijos: no se pueden eliminar"
        >
          <Lock size={13} />
        </span>
      )}
    </>
  );
}

function FixedRow({
  estado,
  onToggleBacklog,
}: {
  estado: EstadoItem;
  onToggleBacklog: () => void;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="inline-block w-4 shrink-0" />
      <EstadoRowContent estado={estado} onToggleBacklog={onToggleBacklog} />
    </li>
  );
}

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
  const inicial = ordenados.find((e) => e.esInicial);
  const final = ordenados.find((e) => e.esFinal);
  const intermedios = ordenados.filter((e) => !e.esInicial && !e.esFinal);

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

  async function toggleMostrarEnBacklog(estado: EstadoItem) {
    const actualizado = await apiPatch<EstadoItem>(`/api/estados/${estado.id}`, {
      mostrarEnBacklog: !estado.mostrarEnBacklog,
    });
    onChange(estados.map((e) => (e.id === estado.id ? actualizado : e)));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = intermedios.findIndex((e) => e.id === active.id);
    const newIndex = intermedios.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordenados = arrayMove(intermedios, oldIndex, newIndex);
    const base = (inicial?.orden ?? -1) + 1;
    onChange(
      estados.map((e) => {
        const nuevoIndex = reordenados.findIndex((r) => r.id === e.id);
        return nuevoIndex === -1 ? e : { ...e, orden: base + nuevoIndex };
      }),
    );
    await Promise.all(
      reordenados.map((estado, index) => {
        const nuevoOrden = base + index;
        return estado.orden === nuevoOrden
          ? Promise.resolve()
          : apiPatch<EstadoItem>(`/api/estados/${estado.id}`, { orden: nuevoOrden });
      }),
    );
  }

  return (
    <Section title="Estados (columnas del Kanban)">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        El orden acá define el orden de las columnas en el tablero Kanban. El estado
        inicial y el final son fijos (podés cambiarles nombre y color, pero no
        eliminarlos ni moverlos); los estados nuevos se agregan siempre entre medio.
      </p>
      <ul className="mb-4 divide-y divide-slate-100 dark:divide-slate-800">
        {inicial && (
          <FixedRow estado={inicial} onToggleBacklog={() => toggleMostrarEnBacklog(inicial)} />
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={intermedios.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {intermedios.map((estado) => (
              <SortableRow key={estado.id} id={estado.id}>
                <EstadoRowContent
                  estado={estado}
                  onToggleBacklog={() => toggleMostrarEnBacklog(estado)}
                  onEliminar={() => eliminar(estado.id)}
                />
              </SortableRow>
            ))}
          </SortableContext>
        </DndContext>
        {final && (
          <FixedRow estado={final} onToggleBacklog={() => toggleMostrarEnBacklog(final)} />
        )}
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
