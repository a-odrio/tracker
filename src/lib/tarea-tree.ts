import type { TareaItem } from "@/lib/types";

export function hijosDirectos(tareaId: number, tareas: TareaItem[]): TareaItem[] {
  return tareas.filter((t) => t.parentId === tareaId);
}

/** Una tarea es "hoja efectiva" si no tiene hijos, o si todos sus hijos
 * están en un estado esFinal. Solo las hojas efectivas son "trabajables":
 * aparecen en Kanban y en el backlog de Planificación. */
export function esHojaEfectiva(tarea: TareaItem, tareas: TareaItem[]): boolean {
  const hijos = hijosDirectos(tarea.id, tareas);
  return hijos.length === 0 || hijos.every((h) => h.estado?.esFinal ?? false);
}

/** Hojas efectivas del subárbol de `tarea` (incluida ella misma si ya lo es).
 * La recursión se corta en la primera hoja efectiva de cada rama, para que
 * un contenedor recién "cerrado" se muestre a sí mismo y no a sus hijos ya
 * finalizados. Es lo que alimenta el Kanban. */
export function hojasDe(tarea: TareaItem, tareas: TareaItem[]): TareaItem[] {
  if (esHojaEfectiva(tarea, tareas)) return [tarea];
  return hijosDirectos(tarea.id, tareas).flatMap((h) => hojasDe(h, tareas));
}

/** Todos los ids del subárbol de `tareaId` (incluido él mismo), sin filtrar
 * por estado — para sumar horas de un subárbol completo en Reportes. */
export function idsDeSubarbol(tareaId: number, tareas: TareaItem[]): number[] {
  const directos = hijosDirectos(tareaId, tareas);
  return [tareaId, ...directos.flatMap((h) => idsDeSubarbol(h.id, tareas))];
}

export function raizDe(tarea: TareaItem, tareas: TareaItem[]): TareaItem {
  let actual = tarea;
  while (actual.parentId != null) {
    const padre = tareas.find((t) => t.id === actual.parentId);
    if (!padre) break;
    actual = padre;
  }
  return actual;
}

/** Ancestros de `tarea` desde la raíz hasta su padre inmediato (sin incluir
 * a `tarea` misma) — para breadcrumbs. */
export function ancestros(tarea: TareaItem, tareas: TareaItem[]): TareaItem[] {
  const cadena: TareaItem[] = [];
  let actual = tarea;
  while (actual.parentId != null) {
    const padre = tareas.find((t) => t.id === actual.parentId);
    if (!padre) break;
    cadena.unshift(padre);
    actual = padre;
  }
  return cadena;
}

export function clienteIdDe(tarea: TareaItem, tareas: TareaItem[]): number | null {
  return raizDe(tarea, tareas).clienteId ?? null;
}

export function colorDe(tarea: TareaItem, tareas: TareaItem[]): string {
  return raizDe(tarea, tareas).color ?? "#64748b";
}

/** true si `objetivoId` es `tareaId` mismo o está anidado en cualquier
 * profundidad debajo de él. Usado para bloquear reparenting cíclico. */
export function esDescendiente(
  tareaId: number,
  objetivoId: number,
  tareas: TareaItem[],
): boolean {
  if (tareaId === objetivoId) return true;
  return hijosDirectos(tareaId, tareas).some((h) => esDescendiente(h.id, objetivoId, tareas));
}

/** Descendientes de `raizId` (sin incluirla), en profundidad, con su nivel
 * de anidado — para renderizar los <select> planos con sangría en
 * Registro/Timer. */
export function descendientesIndentados(
  raizId: number,
  tareas: TareaItem[],
): { tarea: TareaItem; profundidad: number }[] {
  const directos = hijosDirectos(raizId, tareas).sort((a, b) => a.orden - b.orden);
  return directos.flatMap((h) => [
    { tarea: h, profundidad: 0 },
    ...descendientesIndentados(h.id, tareas).map((d) => ({
      ...d,
      profundidad: d.profundidad + 1,
    })),
  ]);
}

/** Si el cambio que llevó a `tareaId` de `tareasAntes` a `tareasDespues`
 * cerró (esFinal) su último hermano abierto, devuelve el padre — para
 * disparar el aviso de "se completaron todas las subtareas". Null si no
 * corresponde. */
export function padreRecienCerrado(
  tareaId: number,
  tareasAntes: TareaItem[],
  tareasDespues: TareaItem[],
): TareaItem | null {
  const antes = tareasAntes.find((t) => t.id === tareaId);
  const despues = tareasDespues.find((t) => t.id === tareaId);
  if (!antes || !despues || despues.parentId == null) return null;
  if (antes.estado?.esFinal || !despues.estado?.esFinal) return null;
  const abiertosAntes = hijosDirectos(despues.parentId, tareasAntes).filter(
    (h) => !(h.estado?.esFinal ?? false),
  );
  const eraElUnico = abiertosAntes.length === 1 && abiertosAntes[0].id === tareaId;
  return eraElUnico ? (tareasAntes.find((t) => t.id === despues.parentId) ?? null) : null;
}
