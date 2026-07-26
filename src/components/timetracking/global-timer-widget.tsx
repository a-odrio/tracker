"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { RegistroTiempoItem } from "@/lib/types";
import { useAppData } from "@/lib/app-data";
import { toDateOnlyISO } from "@/lib/utils";
import { Modal } from "@/components/ui";
import { TimeEntryForm } from "@/components/timetracking/time-entry-form";
import { TimerBar, type SeedRegistro } from "@/components/timetracking/timer-bar";

/**
 * Pastilla flotante con el timer, visible en cualquier pantalla salvo
 * /registro (que ya tiene su propia barra integrada). Lee/escribe los datos
 * compartidos (AppDataProvider) en vez de un fetch propio: cualquier cambio
 * hecho desde otra pantalla se ve acá al instante, sin esperar a nada.
 */
export function GlobalTimerWidget() {
  const pathname = usePathname();
  const {
    clientesActivos,
    tareas,
    upsertTarea,
    tiposActivos,
    setTipos,
    estados,
    tema,
    loading,
    error,
  } = useAppData();
  const [seed, setSeed] = useState<SeedRegistro | null>(null);
  const [registrosDelDia, setRegistrosDelDia] = useState<RegistroTiempoItem[]>([]);

  async function abrirRegistroManual(s: SeedRegistro) {
    const fecha = s.fecha ?? toDateOnlyISO(new Date());
    const dia = await apiGet<RegistroTiempoItem[]>(
      `/api/registros-tiempo?desde=${fecha}&hasta=${fecha}`,
    );
    setRegistrosDelDia(dia);
    setSeed({ ...s, fecha });
  }

  if (pathname?.startsWith("/registro")) return null;
  if (error) {
    return (
      <div
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 shadow-lg dark:border-red-900 dark:bg-slate-900 dark:text-red-400"
        title={error}
      >
        <AlertCircle size={14} /> Error al cargar datos
      </div>
    );
  }
  if (loading || !tema) return null;
  if (!tareas.some((t) => t.parentId === null)) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      <TimerBar
        floating
        clientes={clientesActivos}
        tareas={tareas}
        tipos={tiposActivos}
        estados={estados}
        colorPrincipal={tema.colorPrincipal}
        avisoTimerHoras={tema.avisoTimerHoras}
        onTareaCreated={upsertTarea}
        onAbrirRegistro={abrirRegistroManual}
      />

      {seed && (
        <Modal open onClose={() => setSeed(null)} title="Nuevo registro" size="lg">
          <TimeEntryForm
            clientes={clientesActivos}
            tareas={tareas}
            tipos={tiposActivos}
            estados={estados}
            colorPrincipal={tema.colorPrincipal}
            registrosDelDia={registrosDelDia}
            valoresIniciales={seed}
            onTareaCreated={upsertTarea}
            onTipoCreated={(tipo) => setTipos((prev) => [...prev, tipo])}
            onSaved={(registro) => {
              if (registro.tarea) upsertTarea(registro.tarea);
              setSeed(null);
            }}
            onCancel={() => setSeed(null)}
          />
        </Modal>
      )}
    </div>
  );
}
