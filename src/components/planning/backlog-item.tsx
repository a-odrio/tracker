"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TareaItem } from "@/lib/types";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/utils";

export function BacklogItem({ tarea }: { tarea: TareaItem }) {
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
          style={{ backgroundColor: tarea.proyecto?.color }}
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
        {tarea.proyecto?.cliente?.nombre} · {tarea.proyecto?.nombre}
      </div>
    </div>
  );
}
