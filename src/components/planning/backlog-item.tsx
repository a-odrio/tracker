"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TareaItem } from "@/lib/types";
import { raizDe } from "@/lib/tarea-tree";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/utils";

export function BacklogItem({
  tarea,
  tareas,
  diasPlanificados = 0,
}: {
  tarea: TareaItem;
  /** Lista plana completa, para resolver la raíz/cliente de la tarea. */
  tareas: TareaItem[];
  diasPlanificados?: number;
}) {
  const raiz = raizDe(tarea, tareas);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tarea-${tarea.id}`,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-md border border-slate-200 bg-white p-2 text-xs shadow-sm active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: raiz.color ?? undefined }}
        />
        <span className="flex-1 truncate font-medium text-slate-800 dark:text-slate-100">
          {tarea.nombre}
        </span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${PRIORIDAD_COLOR[tarea.prioridad]}`}
        >
          {PRIORIDAD_LABEL[tarea.prioridad]}
        </span>
      </div>
      <div className="truncate text-slate-400 dark:text-slate-500">
        {raiz.cliente?.nombre} · {raiz.nombre}
      </div>
      {diasPlanificados > 0 && (
        <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          Planificada en {diasPlanificados} {diasPlanificados === 1 ? "día" : "días"}
        </div>
      )}
    </div>
  );
}
