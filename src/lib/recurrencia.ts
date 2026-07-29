import { addDays, addMonths, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import type { Frecuencia } from "@/lib/types";

/** Etiqueta de período para el nombre de una instancia recurrente. Semanal
 * siempre ancla al lunes de la semana de `fecha`, sin importar el
 * `inicioSemana` configurado en Tema (no tiene por qué coincidir). */
export function periodoLabel(frecuencia: Frecuencia, fecha: Date): string {
  if (frecuencia === "SEMANAL") {
    return `Semana del ${format(startOfWeek(fecha, { weekStartsOn: 1 }), "dd/MM")}`;
  }
  const mes = format(fecha, "MMMM yyyy", { locale: es });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

export function nombreConPeriodo(nombreBase: string, frecuencia: Frecuencia, fecha: Date): string {
  return `${nombreBase} — ${periodoLabel(frecuencia, fecha)}`;
}

/** Fecha que cae en el período siguiente al de `fecha`, saltando `intervalo`
 * unidades (semanas o meses) — usada solo para resolver a qué período
 * corresponde la próxima instancia, no como fecha exacta. */
export function siguientePeriodo(frecuencia: Frecuencia, intervalo: number, fecha: Date): Date {
  return frecuencia === "SEMANAL" ? addDays(fecha, 7 * intervalo) : addMonths(fecha, intervalo);
}
