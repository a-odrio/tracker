"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { raizDe } from "@/lib/tarea-tree";
import { ErrorText } from "@/components/ui";

/**
 * Accesos directos a los últimos trabajos registrados (timer o carga manual),
 * arriba de /registro. Click en la tarjeta arranca el timer directo con ese
 * combo; el botón de calendario abre el registro manual con cliente/proyecto/
 * tarea preseleccionados, dejando fecha/horas/tipo para completar. No ocupa
 * lugar si todavía no hay historial.
 */
export function RegistrosRecientes({
  onRegistroManual,
}: {
  onRegistroManual: (seed: { tareaId: number }) => void;
}) {
  const { tareas, tipos, timer, recientes, iniciarTimer } = useAppData();
  const [error, setError] = useState("");

  const items = recientes
    .map((r) => {
      const tarea = tareas.find((t) => t.id === r.tareaId);
      const tipo = tipos.find((t) => t.id === r.tipoTrabajoId);
      if (!tarea || !tipo) return null;
      const raiz = raizDe(tarea, tareas);
      return { tarea, tipo, raiz };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) return null;

  async function iniciar(tareaId: number, tipoTrabajoId: number) {
    setError("");
    try {
      await iniciarTimer(tareaId, tipoTrabajoId);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {items.map(({ tarea, tipo, raiz }) => (
          <div
            key={`${tarea.id}-${tipo.id}`}
            className="relative flex w-48 flex-col rounded-lg border border-slate-200 bg-white py-2 pr-6 pl-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => iniciar(tarea.id, tipo.id)}
              disabled={!!timer}
              title={timer ? "Ya hay un timer en curso" : `Iniciar timer: ${tarea.nombre}`}
              className="flex flex-col gap-0.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {tarea.id === raiz.id ? raiz.nombre : tarea.nombre}
              </span>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                {raiz.cliente?.nombre}
                {tarea.id !== raiz.id ? ` · ${raiz.nombre}` : ""} · {tipo.nombre}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRegistroManual({ tareaId: tarea.id })}
              title="Cargar como registro manual"
              className="absolute top-2 right-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <CalendarPlus size={14} />
            </button>
          </div>
        ))}
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
