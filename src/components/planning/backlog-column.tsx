"use client";

import { useDroppable } from "@dnd-kit/core";
import type { TareaItem } from "@/lib/types";
import { BacklogItem } from "@/components/planning/backlog-item";

export function BacklogColumn({
  tareas,
  diasPlanificadosPorTarea,
}: {
  tareas: TareaItem[];
  diasPlanificadosPorTarea: Map<number, number>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "backlog" });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 px-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Backlog
        <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
          ({tareas.length})
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[20rem] flex-1 space-y-2 overflow-y-auto rounded-lg p-2 ${
          isOver
            ? "bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40 dark:ring-blue-700"
            : "bg-slate-100 dark:bg-slate-900/60"
        }`}
      >
        {tareas.map((tarea) => (
          <BacklogItem
            key={tarea.id}
            tarea={tarea}
            diasPlanificados={diasPlanificadosPorTarea.get(tarea.id) ?? 0}
          />
        ))}
        {tareas.length === 0 && (
          <p className="p-2 text-center text-xs text-slate-400 dark:text-slate-600">
            Sin tareas pendientes de planificar.
          </p>
        )}
      </div>
    </div>
  );
}
