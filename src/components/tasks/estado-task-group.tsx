"use client";

import { ChevronRight } from "lucide-react";
import type { EstadoItem, TareaItem } from "@/lib/types";
import { TaskTable } from "@/components/tasks/task-table";

export function EstadoTaskGroup({
  estado,
  tareasDelEstado,
  tareasVisibles,
  expanded,
  onToggle,
  onReorder,
  onEdit,
  onDelete,
}: {
  estado: EstadoItem;
  tareasDelEstado: TareaItem[];
  tareasVisibles: TareaItem[];
  expanded: boolean;
  onToggle: () => void;
  onReorder: (tareasDelEstado: TareaItem[]) => void;
  onEdit: (tarea: TareaItem) => void;
  onDelete: (tarea: TareaItem) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <ChevronRight
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: estado.color }}
        />
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {estado.nombre}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {tareasVisibles.length}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <TaskTable
            tareasDelEstado={tareasDelEstado}
            tareasVisibles={tareasVisibles}
            onReorder={onReorder}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
