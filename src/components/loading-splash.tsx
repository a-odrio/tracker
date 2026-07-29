import { Loader2 } from "lucide-react";

/** A partir de qué fracción de avance (0 a 1) mostrar cada mensaje. */
const UMBRALES: { hasta: number; mensaje: string }[] = [
  { hasta: 0.4, mensaje: "Cargando datos…" },
  { hasta: 0.9, mensaje: "Aprontando todo…" },
  { hasta: 1, mensaje: "Ya casi estamos…" },
];

function mensajeDe(progress: number) {
  return (UMBRALES.find((u) => progress <= u.hasta) ?? UMBRALES[UMBRALES.length - 1]).mensaje;
}

/** Splash a pantalla completa mientras se hace el fetch inicial de la app
 * (clientes/tareas/estados/tipos/tema) en AppDataProvider — reemplaza al
 * shell entero (sidebar incluida) hasta que hay algo real para mostrar, así
 * no se llega a ver un estado vacío ("no hay nada creado") de arranque. */
export function LoadingSplash({ progress }: { progress: number }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <Loader2 size={26} className="animate-spin text-[var(--accent-primary)]" />
        Tracker
      </div>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-300 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{mensajeDe(progress)}</p>
    </div>
  );
}
