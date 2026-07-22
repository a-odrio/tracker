"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Zap } from "lucide-react";
import { apiPatch } from "@/lib/api-client";
import type { TareaItem } from "@/lib/types";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/utils";

function SortableTaskRow({ tarea, children }: { tarea: TareaItem; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="w-6 py-2.5 pr-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
        >
          <GripVertical size={14} />
        </button>
      </td>
      {children}
    </tr>
  );
}

export function TaskTable({
  tareasDelEstado,
  tareasVisibles,
  onReorder,
  onEdit,
  onDelete,
}: {
  /** Todas las tareas de este estado, sin aplicar los filtros de la pantalla — define el orden real a persistir. */
  tareasDelEstado: TareaItem[];
  /** Subconjunto de `tareasDelEstado` que pasa los filtros activos; es lo que se muestra y se puede arrastrar. */
  tareasVisibles: TareaItem[];
  onReorder: (tareasDelEstado: TareaItem[]) => void;
  onEdit: (tarea: TareaItem) => void;
  onDelete: (tarea: TareaItem) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tareasVisibles.findIndex((t) => t.id === active.id);
    const newIndex = tareasVisibles.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const visiblesReordenadas = arrayMove(tareasVisibles, oldIndex, newIndex);

    // Reinserta el subconjunto reordenado en sus mismas posiciones dentro de la
    // lista completa del estado, para no alterar la posición de las tareas que
    // los filtros dejan ocultas.
    const idsReordenados = new Set(visiblesReordenadas.map((t) => t.id));
    const cola = [...visiblesReordenadas];
    const nuevasDelEstado = tareasDelEstado.map((t) =>
      idsReordenados.has(t.id) ? cola.shift()! : t,
    );

    onReorder(nuevasDelEstado);

    await Promise.all(
      nuevasDelEstado.map((tarea, index) =>
        tarea.orden === index
          ? Promise.resolve()
          : apiPatch(`/api/tareas/${tarea.id}`, { orden: index }),
      ),
    );
  }

  if (tareasVisibles.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Sin tareas en este estado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="w-6"></th>
              <th className="py-2 pr-3">Tarea</th>
              <th className="py-2 pr-3">Proyecto</th>
              <th className="py-2 pr-3">Prioridad</th>
              <th className="py-2 pr-3">Hs. estimadas</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <SortableContext
            items={tareasVisibles.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tareasVisibles.map((tarea) => (
                <SortableTaskRow key={tarea.id} tarea={tarea}>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                      {tarea.imprevista && (
                        <span title="Tarea imprevista">
                          <Zap size={13} className="shrink-0 text-amber-500" />
                        </span>
                      )}
                      {tarea.nombre}
                    </div>
                    {tarea.descripcion && (
                      <div className="max-w-md truncate text-xs text-slate-500 dark:text-slate-400">
                        {tarea.descripcion}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span
                        title={tarea.proyecto?.cliente?.nombre}
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tarea.proyecto?.cliente?.color }}
                      />
                      {tarea.proyecto?.nombre}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORIDAD_COLOR[tarea.prioridad]}`}
                    >
                      {PRIORIDAD_LABEL[tarea.prioridad]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                    {tarea.horasEstimadas ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => onEdit(tarea)}
                        title="Editar"
                        className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(tarea)}
                        title="Eliminar"
                        className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </SortableTaskRow>
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}
