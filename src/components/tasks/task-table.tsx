"use client";

import type { TareaItem } from "@/lib/types";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/utils";

export function TaskTable({
  tareas,
  onEdit,
  onDelete,
}: {
  tareas: TareaItem[];
  onEdit: (tarea: TareaItem) => void;
  onDelete: (tarea: TareaItem) => void;
}) {
  if (tareas.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay tareas que coincidan con los filtros.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="py-2 pr-3">Tarea</th>
            <th className="py-2 pr-3">Cliente / Proyecto</th>
            <th className="py-2 pr-3">Estado</th>
            <th className="py-2 pr-3">Prioridad</th>
            <th className="py-2 pr-3">Hs. estimadas</th>
            <th className="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tareas.map((tarea) => (
            <tr key={tarea.id}>
              <td className="py-2.5 pr-3">
                <div className="font-medium text-slate-900 dark:text-slate-100">
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
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tarea.proyecto?.color }}
                  />
                  {tarea.proyecto?.cliente?.nombre} · {tarea.proyecto?.nombre}
                </div>
              </td>
              <td className="py-2.5 pr-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${tarea.estado?.color}22`,
                    color: tarea.estado?.color,
                  }}
                >
                  {tarea.estado?.nombre}
                </span>
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
              <td className="py-2.5 pr-3 text-right">
                <button
                  onClick={() => onEdit(tarea)}
                  className="mr-3 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(tarea)}
                  className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
