"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiGet, apiPatch } from "@/lib/api-client";
import type {
  ClienteItem,
  EstadoItem,
  RegistroTiempoItem,
  TareaItem,
  TemaItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { padreRecienCerrado } from "@/lib/tarea-tree";
import { toDateOnlyISO } from "@/lib/utils";
import { InlineBanner, Modal } from "@/components/ui";
import { TimeEntryForm } from "@/components/timetracking/time-entry-form";
import { TimerBar, type SeedRegistro } from "@/components/timetracking/timer-bar";

/**
 * Pastilla flotante con el timer, visible en cualquier pantalla salvo
 * /registro (que ya tiene su propia barra integrada). Mantiene su propio
 * fetch de datos, igual que cada página, para no depender de qué pantalla
 * esté montada debajo; se refresca al cambiar de ruta porque el layout no
 * remonta en la navegación.
 */
export function GlobalTimerWidget() {
  const pathname = usePathname();
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [tipos, setTipos] = useState<TipoTrabajoItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState<SeedRegistro | null>(null);
  const [registrosDelDia, setRegistrosDelDia] = useState<RegistroTiempoItem[]>([]);
  const [padreParaCerrar, setPadreParaCerrar] = useState<TareaItem | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<TipoTrabajoItem[]>("/api/tipos-trabajo"),
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TemaItem>("/api/tema"),
    ])
      .then(([c, t, ti, e, tm]) => {
        setClientes(c);
        setTareas(t);
        setTipos(ti);
        setEstados(e);
        setTema(tm);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

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
        clientes={clientes}
        tareas={tareas}
        tipos={tipos}
        estados={estados}
        colorPrincipal={tema.colorPrincipal}
        onTareaCreated={(tarea) => setTareas((prev) => [...prev, tarea])}
        onAbrirRegistro={abrirRegistroManual}
      />

      {seed && (
        <Modal open onClose={() => setSeed(null)} title="Nuevo registro" size="lg">
          <TimeEntryForm
            clientes={clientes}
            tareas={tareas}
            tipos={tipos}
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
