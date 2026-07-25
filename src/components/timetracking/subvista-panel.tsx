import type { ReactNode } from "react";

/**
 * Chrome de "sub-vista con volver" compartido por TimerBar y TimeEntryForm
 * para sus formularios embebidos (nuevo proyecto, nuevo tipo de trabajo):
 * un botón para volver a la vista principal, un título, y el contenido.
 */
export function SubVistaPanel({
  titulo,
  volverLabel = "← Volver",
  contenedor = false,
  onVolver,
  children,
}: {
  titulo: string;
  volverLabel?: string;
  /** Envuelve el panel en su propia caja (borde + fondo) — para cuando se
   * muestra suelto, sin un contenedor propio alrededor (ej. TimerBar). */
  contenedor?: boolean;
  onVolver: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={
        contenedor
          ? "space-y-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          : "space-y-3"
      }
    >
      <button
        onClick={onVolver}
        className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        {volverLabel}
      </button>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{titulo}</h3>
      {children}
    </div>
  );
}
