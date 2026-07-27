const KEY = "tracker:recientes-registros";
const MAX = 5;

export type ComboReciente = { tareaId: number; tipoTrabajoId: number; usadoEn: number };

/** Guarda en localStorage el combo tarea+tipo recién usado (timer iniciado o
 * registro manual guardado), para los accesos directos de /registro. Es
 * historial puramente local (la app no tiene backend para esto ni falta,
 * ver CLAUDE.md), sin duplicados y con el más reciente primero. */
export function registrarUso(tareaId: number, tipoTrabajoId: number) {
  if (typeof window === "undefined") return;
  const sinDuplicado = obtenerRecientes().filter(
    (c) => !(c.tareaId === tareaId && c.tipoTrabajoId === tipoTrabajoId),
  );
  const nuevos = [{ tareaId, tipoTrabajoId, usadoEn: Date.now() }, ...sinDuplicado].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(nuevos));
}

export function obtenerRecientes(): ComboReciente[] {
  if (typeof window === "undefined") return [];
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(datos) ? (datos as ComboReciente[]) : [];
  } catch {
    return [];
  }
}
