"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { EstadoItem, TareaItem } from "@/lib/types";
import { TaskCard } from "@/components/kanban/task-card";

export function KanbanColumn({
  estado,
  tareas,
  onTaskClick,
}: {
  estado: EstadoItem;
  tareas: TareaItem[];
  onTaskClick: (tarea: TareaItem) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `columna-${estado.id}` });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: estado.color }}
        />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {estado.nombre}
        </h3>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {tareas.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto p-2 pt-0">
        <SortableContext
          items={tareas.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tareas.map((tarea) => (
            <TaskCard
              key={tarea.id}
              tarea={tarea}
              onClick={() => onTaskClick(tarea)}
            />
          ))}
        </SortableContext>
        {tareas.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-600">
            Sin tareas
          </div>
        )}
      </div>
    </div>
  );
}
