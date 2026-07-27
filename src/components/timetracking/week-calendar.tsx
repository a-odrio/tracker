"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange } from "lucide-react";
import type { RegistroTiempoItem, TareaItem } from "@/lib/types";
import { raizDe } from "@/lib/tarea-tree";
import { formatDate, minutesToTime, timeToMinutes, toDateOnlyISO } from "@/lib/utils";

const HOUR_HEIGHT = 52;
const HORA_INICIO_DEFAULT = 8;
const SNAP_MIN = 15;
/** Los registros ocupan como máximo esta fracción del ancho del día, dejando el resto libre para seleccionar. */
const ITEM_WIDTH_RATIO = 0.82;

type DragState = { diaISO: string; startMin: number; currentMin: number };

export type VistaCalendario = "3dias" | "laboral" | "completa";

const OPCIONES_VISTA: { value: VistaCalendario; label: string }[] = [
  { value: "3dias", label: "3 días" },
  { value: "laboral", label: "Lunes a viernes" },
  { value: "completa", label: "Semana completa" },
];

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
  tareas,
  onEdit,
  onSelect,
  vista,
  onVistaChange,
  horaInicioDefault = HORA_INICIO_DEFAULT,
}: {
  dias: Date[];
  registros: RegistroTiempoItem[];
  /** Lista plana completa, para resolver la raíz/color de cada registro. */
  tareas: TareaItem[];
  onEdit: (registro: RegistroTiempoItem) => void;
  /** Se dispara al seleccionar un período libre arrastrando en el calendario. */
  onSelect?: (fecha: string, horaInicio: string, horaFin: string) => void;
  vista: VistaCalendario;
  onVistaChange: (vista: VistaCalendario) => void;
  /** Hora en la que arranca la grilla por defecto (configurable) — igual se
   * expande hacia atrás si hay algún registro más temprano. */
  horaInicioDefault?: number;
}) {
  const [vistaAbierta, setVistaAbierta] = useState(false);
  const vistaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vistaAbierta) return;
    function onMouseDown(e: MouseEvent) {
      if (vistaRef.current && !vistaRef.current.contains(e.target as Node)) {
        setVistaAbierta(false);
      }
    }
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [vistaAbierta]);

  const { horaInicioEje, horaFinEje } = useMemo(() => {
    let min = horaInicioDefault;
    let max = 21;
    for (const r of registros) {
      min = Math.min(min, Math.floor(timeToMinutes(r.horaInicio) / 60));
      max = Math.max(max, Math.ceil(timeToMinutes(r.horaFin) / 60));
    }
    return { horaInicioEje: min, horaFinEje: max };
  }, [registros, horaInicioDefault]);

  const rangeRef = useRef({ horaInicioEje, horaFinEje });
  useEffect(() => {
    rangeRef.current = { horaInicioEje, horaFinEje };
  }, [horaInicioEje, horaFinEje]);
  const dragElRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<DragState | null>(null);

  function minutesFromClientY(clientY: number) {
    const el = dragElRef.current;
    const { horaInicioEje: hi, horaFinEje: hf } = rangeRef.current;
    if (!el) return hi * 60;
    const rect = el.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const raw = hi * 60 + (y / HOUR_HEIGHT) * 60;
    const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN;
    return Math.max(hi * 60, Math.min(hf * 60, snapped));
  }

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!dragStateRef.current) return;
      dragStateRef.current = {
        ...dragStateRef.current,
        currentMin: minutesFromClientY(e.clientY),
      };
      setDragPreview(dragStateRef.current);
    }
    function handleUp() {
      const d = dragStateRef.current;
      dragStateRef.current = null;
      dragElRef.current = null;
      setDragPreview(null);
      if (!d || !onSelect) return;
      let inicio = Math.min(d.startMin, d.currentMin);
      let fin = Math.max(d.startMin, d.currentMin);
      if (fin - inicio < SNAP_MIN) {
        const { horaInicioEje: hi, horaFinEje: hf } = rangeRef.current;
        fin = Math.min(inicio + 60, hf * 60);
        inicio = Math.max(fin - 60, hi * 60);
      }
      onSelect(d.diaISO, minutesToTime(inicio), minutesToTime(fin));
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [onSelect]);

  function onDayMouseDown(e: React.MouseEvent<HTMLDivElement>, dia: Date) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    dragElRef.current = e.currentTarget;
    const min = minutesFromClientY(e.clientY);
    const diaISO = toDateOnlyISO(dia);
    dragStateRef.current = { diaISO, startMin: min, currentMin: min };
    setDragPreview(dragStateRef.current);
  }

  const horas = Array.from(
    { length: horaFinEje - horaInicioEje + 1 },
    (_, i) => horaInicioEje + i,
  );
  const alturaTotal = (horaFinEje - horaInicioEje) * HOUR_HEIGHT;

  function registrosDelDia(dia: Date) {
    const iso = toDateOnlyISO(dia);
    return registros.filter((r) => r.fecha.slice(0, 10) === iso);
  }

  function topForMinutes(minutos: number) {
    return ((minutos - horaInicioEje * 60) / 60) * HOUR_HEIGHT;
  }
  function topFor(horaInicio: string) {
    return topForMinutes(timeToMinutes(horaInicio));
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
          <div
            ref={vistaRef}
            className="relative sticky top-0 z-10 flex h-10 items-center justify-center border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setVistaAbierta((v) => !v)}
              title="Cambiar vista"
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <CalendarRange size={14} />
            </button>
            {vistaAbierta && (
              <div className="absolute top-full left-0 z-30 mt-1 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                {OPCIONES_VISTA.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onVistaChange(o.value);
                      setVistaAbierta(false);
                    }}
                    className={`block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      vista === o.value
                        ? "bg-[var(--accent-primary)]/10 font-medium text-slate-900 dark:text-slate-100"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              className="min-w-0 flex-1 border-r border-slate-100 last:border-r-0 dark:border-slate-800"
            >
              <div
                className={`sticky top-0 z-10 flex h-10 flex-col items-center justify-center overflow-hidden border-b border-slate-100 px-1 text-xs dark:border-slate-800 ${isToday ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]" : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
              >
                <span className="truncate font-semibold capitalize">{formatDate(dia, "EEEE")}</span>
                <span className="truncate opacity-70">{formatDate(dia, "dd/MM")}</span>
              </div>
              <div
                style={{ height: alturaTotal }}
                className="relative cursor-crosshair select-none bg-slate-50/50 dark:bg-slate-950/40"
                onMouseDown={(e) => onDayMouseDown(e, dia)}
              >
                {horas.map((h, i) => (
                  <div
                    key={h}
                    style={{ top: i * HOUR_HEIGHT }}
                    className="pointer-events-none absolute w-full border-t border-slate-100 dark:border-slate-800"
                  />
                ))}
                {dragPreview && dragPreview.diaISO === toDateOnlyISO(dia) && (
                  <div
                    style={{
                      top: Math.min(
                        topForMinutes(dragPreview.startMin),
                        topForMinutes(dragPreview.currentMin),
                      ),
                      height: Math.max(
                        Math.abs(
                          topForMinutes(dragPreview.currentMin) -
                            topForMinutes(dragPreview.startMin),
                        ),
                        4,
                      ),
                    }}
                    className="pointer-events-none absolute inset-x-1 z-10 overflow-hidden rounded-md border-2 border-dashed border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]"
                  >
                    {minutesToTime(Math.min(dragPreview.startMin, dragPreview.currentMin))}–
                    {minutesToTime(Math.max(dragPreview.startMin, dragPreview.currentMin))}
                  </div>
                )}
                {items.map(({ registro, left, width }) => {
                  const raiz = registro.tarea ? raizDe(registro.tarea, tareas) : undefined;
                  const color = raiz?.color ?? "#64748b";
                  return (
                    <button
                      key={registro.id}
                      onClick={() => onEdit(registro)}
                      style={{
                        top: topFor(registro.horaInicio),
                        height: heightFor(registro.horaInicio, registro.horaFin),
                        left: `calc(${left * ITEM_WIDTH_RATIO * 100}% + 2px)`,
                        width: `calc(${width * ITEM_WIDTH_RATIO * 100}% - 4px)`,
                        backgroundColor: `${color}33`,
                        borderLeft: `3px solid ${color}`,
                      }}
                      className="absolute overflow-hidden rounded-r-md px-1.5 py-0.5 text-left text-[10px] leading-tight text-slate-800 hover:z-10 hover:ring-1 hover:ring-slate-400 dark:text-slate-100"
                    >
                      <div className="truncate font-medium">
                        {registro.tarea && registro.tarea.id !== raiz?.id
                          ? registro.tarea.nombre
                          : "(tarea general)"}
                      </div>
                      <div className="truncate opacity-70">{raiz?.nombre}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
