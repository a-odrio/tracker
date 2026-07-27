import {
  addDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: string | Date, fmt = "dd/MM/yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function toDateOnlyISO(date: Date) {
  return format(date, "yyyy-MM-dd");
}

type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function weekDays(anchor: Date, weekStartsOn: DiaSemana = 1) {
  const start = startOfWeek(anchor, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekRange(anchor: Date, weekStartsOn: DiaSemana = 1) {
  return {
    start: startOfWeek(anchor, { weekStartsOn }),
    end: endOfWeek(anchor, { weekStartsOn }),
  };
}

/** Lunes a viernes de la semana que contiene `anchor` — fijo, sin importar
 * el día configurado de inicio de semana (el fin de semana laboral no cambia). */
export function diasLaborales(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 5 }, (_, i) => addDays(start, i));
}

/** Ventana de 3 días consecutivos arrancando en `anchor`. */
export function diasVentana3(anchor: Date) {
  return Array.from({ length: 3 }, (_, i) => addDays(anchor, i));
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Total minutes actually covered by a set of [fecha, horaInicio, horaFin]
 * intervals, merging overlaps within the same day so double-booked time
 * isn't counted twice.
 */
export function sumarMinutosSinSolapar(
  intervalos: { fecha: string; horaInicio: string; horaFin: string }[],
) {
  const porDia = new Map<string, { inicio: number; fin: number }[]>();
  for (const i of intervalos) {
    const dia = i.fecha.slice(0, 10);
    const lista = porDia.get(dia) ?? [];
    lista.push({ inicio: timeToMinutes(i.horaInicio), fin: timeToMinutes(i.horaFin) });
    porDia.set(dia, lista);
  }

  let total = 0;
  for (const lista of porDia.values()) {
    const ordenados = [...lista].sort((a, b) => a.inicio - b.inicio);
    let actualInicio = -1;
    let actualFin = -1;
    for (const { inicio, fin } of ordenados) {
      if (actualInicio === -1) {
        actualInicio = inicio;
        actualFin = fin;
      } else if (inicio <= actualFin) {
        actualFin = Math.max(actualFin, fin);
      } else {
        total += actualFin - actualInicio;
        actualInicio = inicio;
        actualFin = fin;
      }
    }
    if (actualInicio !== -1) total += actualFin - actualInicio;
  }
  return total;
}

export function minutesToDurationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export const PRIORIDAD_LABEL: Record<string, string> = {
  URGENTE: "Urgente",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const PRIORIDAD_COLOR: Record<string, string> = {
  URGENTE: "bg-red-600 text-white",
  ALTA: "bg-orange-500 text-white",
  MEDIA: "bg-amber-400 text-slate-900",
  BAJA: "bg-slate-300 text-slate-800",
};
