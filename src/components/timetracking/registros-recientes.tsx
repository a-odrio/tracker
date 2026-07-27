"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useAppData } from "@/lib/app-data";
import { raizDe } from "@/lib/tarea-tree";
import { ErrorText } from "@/components/ui";

const GAP = 8;
const ANCHO_MIN = 150;
const ANCHO_MAX = 220;

/**
 * Accesos directos a los últimos trabajos registrados (timer o carga manual),
 * arriba de /registro (y, más compacto, en el widget flotante). Click en la
 * tarjeta arranca el timer directo con ese combo; el botón de calendario abre
 * el registro manual con proyecto/tarea preseleccionados, dejando fecha/
 * horas/tipo para completar. No ocupa lugar si todavía no hay historial.
 *
 * El ancho disponible se mide con ResizeObserver: la cantidad de tarjetas
 * mostradas (hasta las que haya) y el ancho de cada una se ajustan para
 * llenar esa fila exacta, sin salirse ni dejar hueco, con cada tarjeta
 * acotada entre ANCHO_MIN y ANCHO_MAX.
 */
export function RegistrosRecientes({
  onRegistroManual,
}: {
  onRegistroManual: (seed: { tareaId: number }) => void;
}) {
  const { tareas, tipos, timer, recientes, iniciarTimer } = useAppData();
  const [error, setError] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [anchoDisponible, setAnchoDisponible] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      setAnchoDisponible(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const todos = recientes
    .map((r) => {
      const tarea = tareas.find((t) => t.id === r.tareaId);
      const tipo = tipos.find((t) => t.id === r.tipoTrabajoId);
      if (!tarea || !tipo) return null;
      const raiz = raizDe(tarea, tareas);
      return { tarea, tipo, raiz };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (todos.length === 0) return null;

  const count =
    anchoDisponible > 0
      ? Math.max(1, Math.min(todos.length, Math.floor((anchoDisponible + GAP) / (ANCHO_MIN + GAP))))
      : todos.length;
  const anchoTarjeta =
    anchoDisponible > 0
      ? Math.min(ANCHO_MAX, (anchoDisponible - (count - 1) * GAP) / count)
      : ANCHO_MIN;
  const items = todos.slice(0, count);

  async function iniciar(tareaId: number, tipoTrabajoId: number) {
    setError("");
    try {
      await iniciarTimer(tareaId, tipoTrabajoId);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div ref={wrapRef} className="flex flex-col gap-1.5">
      <div className="flex flex-nowrap gap-2">
        {items.map(({ tarea, tipo, raiz }) => {
          const subtitulo = [tarea.id !== raiz.id ? raiz.nombre : null, tipo.nombre]
            .filter(Boolean)
            .join(" · ");
          return (
            <div
              key={`${tarea.id}-${tipo.id}`}
              style={{ width: anchoDisponible > 0 ? anchoTarjeta : undefined }}
              className="relative flex min-w-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white py-2 pr-6 pl-3 dark:border-slate-800 dark:bg-slate-900"
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
                  {subtitulo}
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
          );
        })}
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
