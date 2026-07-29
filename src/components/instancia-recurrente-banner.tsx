"use client";

import { useAppData } from "@/lib/app-data";
import { InlineBanner } from "@/components/ui";

/**
 * Aviso de "se creó automáticamente la siguiente instancia de X" — montado
 * una sola vez para toda la app (en el layout), igual que
 * PadreParaCerrarBanner. Puramente informativo, sin acción para confirmar.
 */
export function InstanciaRecurrenteBanner() {
  const { instanciaRecurrenteCreada, dismissInstanciaRecurrenteCreada } = useAppData();

  if (!instanciaRecurrenteCreada) return null;

  return (
    <div className="mb-4">
      <InlineBanner
        text={`Se creó automáticamente la siguiente instancia: "${instanciaRecurrenteCreada.nombre}".`}
        onDismiss={dismissInstanciaRecurrenteCreada}
      />
    </div>
  );
}
