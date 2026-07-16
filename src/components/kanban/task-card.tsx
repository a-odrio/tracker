"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TareaItem } from "@/lib/types";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/utils";

export function TaskCard({
  tarea,
  onClick,
}: {
  tarea: TareaItem;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {tarea.nombre}
        </span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORIDAD_COLOR[tarea.prioridad]}`}
        >
          {PRIORIDAD_LABEL[tarea.prioridad]}
        </span>
      </div>
      {tarea.descripcion && (
        <p className="mb-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {tarea.descripcion}
        </p>
      )}
      {tarea.horasEstimadas != null && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {tarea.horasEstimadas}h estimadas
        </span>
      )}
    </div>
  );
}
