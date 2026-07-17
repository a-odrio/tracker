"use client";

import { useMemo } from "react";
import type { RegistroTiempoItem } from "@/lib/types";
import { formatDate, timeToMinutes, toDateOnlyISO } from "@/lib/utils";

const HOUR_HEIGHT = 52;
const HORA_INICIO_DEFAULT = 8;

function layoutDia(items: RegistroTiempoItem[]) {
  const ordenados = [...items].sort(
    (a, b) => timeToMinutes(a.horaInicio) - timeToMinutes(b.horaInicio),
  );
  const columnaFin: number[] = [];
  const posiciones = ordenados.map((registro) => {
    const inicio = timeToMinutes(registro.horaInicio);
    const fin = timeToMinutes(registro.horaFin);
    let columna = columnaFin.findIndex((finCol) => finCol <= inicio);
    if (columna === -1) {
      columna = columnaFin.length;
      columnaFin.push(fin);
    } else {
      columnaFin[columna] = fin;
    }
    return { registro, columna, inicio, fin };
  });

  return posiciones.map((pos) => {
    const solapantes = posiciones.filter(
      (p) => p.inicio < pos.fin && p.fin > pos.inicio,
    );
    const totalColumnas = Math.max(...solapantes.map((p) => p.columna)) + 1;
    return {
      registro: pos.registro,
      left: pos.columna / totalColumnas,
      width: 1 / totalColumnas,
    };
  });
}

export function WeekCalendar({
  dias,
  registros,
  onEdit,
}: {
  dias: Date[];
  registros: RegistroTiempoItem[];
  onEdit: (registro: RegistroTiempoItem) => void;
}) {
  const { horaInicioEje, horaFinEje } = useMemo(() => {
    let min = HORA_INICIO_DEFAULT;
    let max = 21;
    for (const r of registros) {
      min = Math.min(min, Math.floor(timeToMinutes(r.horaInicio) / 60));
      max = Math.max(max, Math.ceil(timeToMinutes(r.horaFin) / 60));
    }
    return { horaInicioEje: min, horaFinEje: max };
  }, [registros]);

  const horas = Array.from(
    { length: horaFinEje - horaInicioEje + 1 },
    (_, i) => horaInicioEje + i,
  );
  const alturaTotal = (horaFinEje - horaInicioEje) * HOUR_HEIGHT;

  function registrosDelDia(dia: Date) {
    const iso = toDateOnlyISO(dia);
    return registros.filter((r) => r.fecha.slice(0, 10) === iso);
  }

  function topFor(horaInicio: string) {
    return ((timeToMinutes(horaInicio) - horaInicioEje * 60) / 60) * HOUR_HEIGHT;
  }
  function heightFor(horaInicio: string, horaFin: string) {
    return Math.max(
      ((timeToMinutes(horaFin) - timeToMinutes(horaInicio)) / 60) * HOUR_HEIGHT,
      18,
    );
  }

  return (
    <div className="h-full overflow-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex">
        <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="sticky top-0 z-10 h-10 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div style={{ height: alturaTotal }} className="relative">
            {horas.map((h, i) => (
              <div
                key={h}
                style={{ top: i * HOUR_HEIGHT }}
                className="absolute -translate-y-2 pr-2 text-right text-[10px] text-slate-400 dark:text-slate-500"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>
        {dias.map((dia) => {
          const items = layoutDia(registrosDelDia(dia));
          const isToday = toDateOnlyISO(dia) === toDateOnlyISO(new Date());
          return (
            <div
              key={dia.toISOString()}
              className="w-36 shrink-0 border-r border-slate-100 last:border-r-0 dark:border-slate-800"
            >
              <div
                className={`sticky top-0 z-10 flex h-10 flex-col items-center justify-center border-b border-slate-100 text-xs dark:border-slate-800 ${isToday ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
              >
                <span className="font-semibold capitalize">{formatDate(dia, "EEEE")}</span>
                <span className="opacity-70">{formatDate(dia, "dd/MM")}</span>
              </div>
              <div
                style={{ height: alturaTotal }}
                className="relative bg-slate-50/50 dark:bg-slate-950/40"
              >
                {horas.map((h, i) => (
                  <div
                    key={h}
                    style={{ top: i * HOUR_HEIGHT }}
                    className="absolute w-full border-t border-slate-100 dark:border-slate-800"
                  />
                ))}
                {items.map(({ registro, left, width }) => (
                  <button
                    key={registro.id}
                    onClick={() => onEdit(registro)}
                    style={{
                      top: topFor(registro.horaInicio),
                      height: heightFor(registro.horaInicio, registro.horaFin),
                      left: `calc(${left * 100}% + 2px)`,
                      width: `calc(${width * 100}% - 4px)`,
                      backgroundColor: `${registro.proyecto?.color ?? "#64748b"}33`,
                      borderLeft: `3px solid ${registro.proyecto?.color ?? "#64748b"}`,
                    }}
                    className="absolute overflow-hidden rounded-r-md px-1.5 py-0.5 text-left text-[10px] leading-tight text-slate-800 hover:z-10 hover:ring-1 hover:ring-slate-400 dark:text-slate-100"
                  >
                    <div className="truncate font-medium">
                      {registro.tarea?.nombre ?? "(sin tarea)"}
                    </div>
                    <div className="truncate opacity-70">{registro.proyecto?.nombre}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
