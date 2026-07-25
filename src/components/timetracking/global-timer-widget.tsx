"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api-client";
import type { RegistroTiempoItem, TareaItem } from "@/lib/types";
import { padreRecienCerrado } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import { toDateOnlyISO } from "@/lib/utils";
import { InlineBanner, Modal } from "@/components/ui";
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
  const { clientesActivos, tareas, setTareas, tiposActivos, setTipos, estados, tema, loading } =
    useAppData();
  const [seed, setSeed] = useState<SeedRegistro | null>(null);
  const [registrosDelDia, setRegistrosDelDia] = useState<RegistroTiempoItem[]>([]);
  const [padreParaCerrar, setPadreParaCerrar] = useState<TareaItem | null>(null);

  async function abrirRegistroManual(s: SeedRegistro) {
    const fecha = s.fecha ?? toDateOnlyISO(new Date());
    const dia = await apiGet<RegistroTiempoItem[]>(
      `/api/registros-tiempo?desde=${fecha}&hasta=${fecha}`,
    );
    setRegistrosDelDia(dia);
    setSeed({ ...s, fecha });
  }

  async function finalizarPadre() {
    if (!padreParaCerrar) return;
    const estadoFinal = estados.find((e) => e.esFinal);
    if (!estadoFinal) return;
    const actualizado = await apiPatch<TareaItem>(`/api/tareas/${padreParaCerrar.id}`, {
      estadoId: estadoFinal.id,
    });
    setTareas((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
    setPadreParaCerrar(null);
  }

  if (pathname?.startsWith("/registro")) return null;
  if (loading || !tema) return null;
  if (!tareas.some((t) => t.parentId === null)) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {padreParaCerrar && (
        <div className="w-[320px]">
          <InlineBanner
            text={`Se completaron todas las subtareas de "${padreParaCerrar.nombre}".`}
            actionLabel="Finalizar tarea"
            onAction={finalizarPadre}
            onDismiss={() => setPadreParaCerrar(null)}
          />
        </div>
      )}

      <TimerBar
        floating
        clientes={clientesActivos}
        tareas={tareas}
        tipos={tiposActivos}
        estados={estados}
        colorPrincipal={tema.colorPrincipal}
        onTareaCreated={(tarea) => setTareas((prev) => [...prev, tarea])}
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
            onTareaCreated={(tarea) => setTareas((prev) => [...prev, tarea])}
            onTipoCreated={(tipo) => setTipos((prev) => [...prev, tipo])}
            onSaved={(registro) => {
              if (registro.tarea) {
                const tareaActualizada = registro.tarea;
                const antes = tareas;
                const nuevas = antes.map((t) =>
                  t.id === tareaActualizada.id ? { ...t, ...tareaActualizada } : t,
                );
                setTareas(nuevas);
                const padre = padreRecienCerrado(tareaActualizada.id, antes, nuevas);
                if (padre) setPadreParaCerrar(padre);
              }
              setSeed(null);
            }}
            onCancel={() => setSeed(null)}
          />
        </Modal>
      )}
    </div>
  );
}
