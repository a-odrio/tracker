"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight } from "lucide-react";
import type { EstadoItem, TareaItem } from "@/lib/types";
import { BacklogItem } from "@/components/planning/backlog-item";

export function BacklogColumn({
  tareas,
  diasPlanificadosPorTarea,
}: {
  tareas: TareaItem[];
  diasPlanificadosPorTarea: Map<number, number>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "backlog" });
  const [colapsados, setColapsados] = useState<Set<number>>(new Set());

  function toggleColapsado(estadoId: number) {
    setColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(estadoId)) next.delete(estadoId);
      else next.add(estadoId);
      return next;
    });
  }

  const grupos = new Map<number, { estado: EstadoItem; tareas: TareaItem[] }>();
  for (const tarea of tareas) {
    if (!tarea.estado) continue;
    const existente = grupos.get(tarea.estadoId);
    if (existente) {
      existente.tareas.push(tarea);
    } else {
      grupos.set(tarea.estadoId, { estado: tarea.estado, tareas: [tarea] });
    }
  }
  const gruposOrdenados = [...grupos.values()].sort(
    (a, b) => a.estado.orden - b.estado.orden,
  );

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
        className={`min-h-[20rem] flex-1 space-y-3 overflow-y-auto rounded-lg p-2 ${
          isOver
            ? "bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40 dark:ring-blue-700"
            : "bg-slate-100 dark:bg-slate-900/60"
        }`}
      >
        {gruposOrdenados.map(({ estado, tareas: tareasDelEstado }) => {
          const expanded = !colapsados.has(estado.id);
          return (
            <div key={estado.id}>
              <button
                type="button"
                onClick={() => toggleColapsado(estado.id)}
                className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-xs font-medium text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800/60"
              >
                <ChevronRight
                  size={12}
                  className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
                />
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: estado.color }}
                />
                <span className="flex-1 truncate">{estado.nombre}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {tareasDelEstado.length}
                </span>
              </button>
              {expanded && (
                <div className="mt-1.5 space-y-2">
                  {tareasDelEstado.map((tarea) => (
                    <BacklogItem
                      key={tarea.id}
                      tarea={tarea}
                      diasPlanificados={diasPlanificadosPorTarea.get(tarea.id) ?? 0}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {tareas.length === 0 && (
          <p className="p-2 text-center text-xs text-slate-400 dark:text-slate-600">
            Sin tareas pendientes de planificar.
          </p>
        )}
      </div>
    </div>
  );
}
