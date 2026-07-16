"use client";

import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import type { PlanificacionItem } from "@/lib/types";

export function AssignedChip({
  item,
  onRemove,
  onHorasChange,
}: {
  item: PlanificacionItem;
  onRemove: () => void;
  onHorasChange: (horas: number | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `plan-${item.id}`,
  });
  const [editando, setEditando] = useState(false);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
      }
    : undefined;

  const tarea = item.tarea;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-md border border-slate-200 bg-white p-1.5 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-1">
        <span
          className="mt-0.5 h-2 w-2 shrink-0 cursor-grab rounded-full active:cursor-grabbing"
          style={{ backgroundColor: tarea?.proyecto?.color }}
          {...attributes}
          {...listeners}
        />
        <div className="min-w-0 flex-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <div className="truncate font-medium text-slate-800 dark:text-slate-100">
            {tarea?.nombre}
          </div>
          <div className="truncate text-[10px] text-slate-400 dark:text-slate-500">
            {tarea?.proyecto?.nombre}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-600 dark:text-slate-600 dark:hover:text-red-400"
          title="Quitar de la semana"
        >
          ×
        </button>
      </div>
      <div className="mt-1 pl-3">
        {editando ? (
          <input
            type="number"
            min="0"
            step="0.5"
            autoFocus
            defaultValue={item.horasPlanificadas ?? ""}
            onBlur={(e) => {
              onHorasChange(e.target.value ? Number(e.target.value) : null);
              setEditando(false);
            }}
            className="w-14 rounded border border-slate-300 px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-950"
          />
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="text-[10px] text-slate-400 hover:underline dark:text-slate-500"
          >
            {item.horasPlanificadas != null
              ? `${item.horasPlanificadas}h planificadas`
              : "+ horas"}
          </button>
        )}
      </div>
    </div>
  );
}
