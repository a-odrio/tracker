"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Empaquetado visual de "pastilla flotante colapsable" — separado del
 * contenido real que envuelve (usado por TimerBar en modo `floating`, para
 * no mezclar "qué muestra" con "cómo se ve flotando"). Colapsado muestra
 * solo `pill`; expandido muestra `children` en una tarjeta de ancho fijo,
 * con un botón para volver a colapsar salvo que `collapsible` sea false
 * (ej. con un timer corriendo, siempre queda expandido).
 */
export function FloatingCard({
  pill,
  collapsible = true,
  children,
}: {
  pill: ReactNode;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const [expandidoPreferido, setExpandidoPreferido] = useState(false);
  const expandido = collapsible ? expandidoPreferido : true;

  if (!expandido) {
    return (
      <button
        type="button"
        onClick={() => setExpandidoPreferido(true)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {pill}
      </button>
    );
  }

  return (
    <div className="relative w-[320px] shadow-lg">
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpandidoPreferido(false)}
          title="Contraer"
          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-slate-100"
        >
          <X size={13} />
        </button>
      )}
      {children}
    </div>
  );
}
