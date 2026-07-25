"use client";

import { useAppData } from "@/lib/app-data";
import { InlineBanner } from "@/components/ui";

/**
 * Aviso de "se completaron todas las subtareas de X" — montado una sola vez
 * para toda la app (en el layout), en vez de que cada pantalla tenga su
 * propia copia del estado y del banner. Así se ve sin importar desde qué
 * pantalla o widget (Kanban, timer flotante, etc.) se disparó el cierre.
 */
export function PadreParaCerrarBanner() {
  const { padreParaCerrar, finalizarPadre, dismissPadreParaCerrar } = useAppData();

  if (!padreParaCerrar) return null;

  return (
    <div className="mb-4">
      <InlineBanner
        text={`Se completaron todas las subtareas de "${padreParaCerrar.nombre}".`}
        actionLabel="Finalizar tarea"
        onAction={finalizarPadre}
        onDismiss={dismissPadreParaCerrar}
      />
    </div>
  );
}
