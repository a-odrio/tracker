"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Zap } from "lucide-react";
import type { Prioridad, TareaItem } from "@/lib/types";
import { PRIORIDAD_COLOR, PRIORIDAD_LABEL } from "@/lib/utils";

const PRIORIDAD_ORDEN: Record<Prioridad, number> = {
  URGENTE: 0,
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
};

type SortKey = "proyecto" | "estado" | "prioridad";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKeyValue,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === sortKeyValue;
  return (
    <th className="py-2 pr-3">
      <button
        type="button"
        onClick={() => onSort(sortKeyValue)}
        className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" />
        )}
      </button>
    </th>
  );
}

export function TaskTable({
  tareas,
  onEdit,
  onDelete,
}: {
  tareas: TareaItem[];
  onEdit: (tarea: TareaItem) => void;
  onDelete: (tarea: TareaItem) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const tareasOrdenadas = useMemo(() => {
    if (!sortKey) return tareas;
    const factor = sortDir === "asc" ? 1 : -1;
    return [...tareas].sort((a, b) => {
      if (sortKey === "proyecto") {
        return (
          factor * (a.proyecto?.nombre ?? "").localeCompare(b.proyecto?.nombre ?? "")
        );
      }
      if (sortKey === "estado") {
        return factor * ((a.estado?.orden ?? 0) - (b.estado?.orden ?? 0));
      }
      return factor * (PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad]);
    });
  }, [tareas, sortKey, sortDir]);

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
            <SortHeader
              label="Proyecto"
              sortKeyValue="proyecto"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <SortHeader
              label="Estado"
              sortKeyValue="estado"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <SortHeader
              label="Prioridad"
              sortKeyValue="prioridad"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            <th className="py-2 pr-3">Hs. estimadas</th>
            <th className="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tareasOrdenadas.map((tarea) => (
            <tr key={tarea.id}>
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
