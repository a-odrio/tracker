"use client";

import { useEffect, useMemo, useState } from "react";
import { addWeeks } from "date-fns";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import type { RegistroTiempoItem, TareaItem } from "@/lib/types";
import { clienteIdDe, padreRecienCerrado } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import {
  formatDate,
  sumarMinutosSinSolapar,
  toDateOnlyISO,
  weekDays,
  weekRange,
} from "@/lib/utils";
import { Button, InlineBanner, Modal, Select } from "@/components/ui";
import { TimeEntryForm } from "@/components/timetracking/time-entry-form";
import { TimerBar } from "@/components/timetracking/timer-bar";
import { WeekCalendar } from "@/components/timetracking/week-calendar";

export default function RegistroPage() {
  const {
    clientesActivos: clientes,
    tareas,
    setTareas,
    tiposActivos: tipos,
    setTipos,
    estados,
    tema,
    loading: datosCargando,
  } = useAppData();
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [registros, setRegistros] = useState<RegistroTiempoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState<number | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RegistroTiempoItem | null>(null);
  const [seleccion, setSeleccion] = useState<{
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
    tareaId?: number;
  } | null>(null);
  const [padreParaCerrar, setPadreParaCerrar] = useState<TareaItem | null>(null);

  const dias = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const { start, end } = useMemo(() => weekRange(weekAnchor), [weekAnchor]);

  const hayProyectos = tareas.some((t) => t.parentId === null);
  const datosListos = !datosCargando;

  useEffect(() => {
    const predeterminado = clientes.find((cl) => cl.predeterminado);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preselect once clientes load
    if (predeterminado) setClienteFiltro(predeterminado.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes.length]);

  function cargarSemana() {
    setLoading(true);
    apiGet<RegistroTiempoItem[]>(
      `/api/registros-tiempo?desde=${toDateOnlyISO(start)}&hasta=${toDateOnlyISO(end)}`,
    )
      .then((data) => {
        setRegistros(data);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data refetch on week change
    cargarSemana();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.getTime(), end.getTime()]);

  async function eliminar(registro: RegistroTiempoItem) {
    if (!confirm("¿Eliminar este registro de tiempo?")) return;
    await apiDelete(`/api/registros-tiempo/${registro.id}`);
    setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
    setEditing(null);
    setSeleccion(null);
    setShowForm(false);
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

  const registrosFiltrados = clienteFiltro
    ? registros.filter(
        (r) => r.tarea && clienteIdDe(r.tarea, tareas) === clienteFiltro,
      )
    : registros;

  const totalHoras = sumarMinutosSinSolapar(registrosFiltrados) / 60;

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar el registro de tiempo: {error}
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Registro de Trabajo
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setWeekAnchor((d) => addWeeks(d, -1))}>
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {formatDate(start)} – {formatDate(end)}
          </span>
          <Button variant="secondary" onClick={() => setWeekAnchor(new Date())}>
            Hoy
          </Button>
          <Button variant="secondary" onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}>
            Siguiente →
          </Button>
        </div>
      </div>

      {datosListos && tema && (
        <div className="shrink-0">
          <TimerBar
            clientes={clientes}
            tareas={tareas}
            tipos={tipos}
            estados={estados}
            colorPrincipal={tema.colorPrincipal}
            clienteInicial={clienteFiltro || undefined}
            onTareaCreated={(tarea) => setTareas((prev) => [...prev, tarea])}
            onAbrirRegistro={(seed) => {
              setEditing(null);
              setSeleccion(seed);
              setShowForm(true);
            }}
          />
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Cliente</span>
          <Select
            className="w-44"
            value={clienteFiltro}
            onChange={(e) =>
              setClienteFiltro(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <span className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
            Total semana:{" "}
            <span className="font-medium">{totalHoras.toFixed(2)}h</span>
          </span>
        </div>
      </div>

      {!hayProyectos && (
        <p className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Necesitás crear al menos un cliente y un proyecto antes de cargar registros.
          Andá a Proyectos.
        </p>
      )}

      {padreParaCerrar && (
        <InlineBanner
          text={`Se completaron todas las subtareas de "${padreParaCerrar.nombre}".`}
          actionLabel="Finalizar tarea"
          onAction={finalizarPadre}
          onDismiss={() => setPadreParaCerrar(null)}
        />
      )}

      {tema && (
        <Modal
          open={(showForm || !!editing) && hayProyectos}
          onClose={() => {
            setEditing(null);
            setSeleccion(null);
            setShowForm(false);
          }}
          title={editing ? "Editar registro" : "Nuevo registro"}
          size="lg"
        >
          <TimeEntryForm
            key={
              editing?.id ??
              (seleccion
                ? `sel-${seleccion.fecha}-${seleccion.horaInicio}-${seleccion.horaFin}-${seleccion.tareaId}`
                : "new")
            }
            clientes={clientes}
            tareas={tareas}
            tipos={tipos}
            estados={estados}
            colorPrincipal={tema.colorPrincipal}
            registrosDelDia={registros}
            registro={editing ?? undefined}
            clienteInicial={clienteFiltro || undefined}
            valoresIniciales={seleccion ?? undefined}
            onTareaCreated={(tarea) => setTareas((prev) => [...prev, tarea])}
            onTipoCreated={(tipo) => setTipos((prev) => [...prev, tipo])}
            onSaved={(registro) => {
              setRegistros((prev) => {
                const exists = prev.some((r) => r.id === registro.id);
                return exists
                  ? prev.map((r) => (r.id === registro.id ? registro : r))
                  : [...prev, registro];
              });
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
              setEditing(null);
              setSeleccion(null);
              setShowForm(false);
            }}
            onCancel={() => {
              setEditing(null);
              setSeleccion(null);
              setShowForm(false);
            }}
          />
          {editing && (
            <button
              onClick={() => eliminar(editing)}
              className="mt-3 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Eliminar este registro
            </button>
          )}
        </Modal>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <div className="min-h-0 flex-1">
          <WeekCalendar
            dias={dias}
            registros={registrosFiltrados}
            tareas={tareas}
            onEdit={(registro) => {
              setEditing(registro);
              setSeleccion(null);
              setShowForm(true);
            }}
            onSelect={(fecha, horaInicio, horaFin) => {
              setEditing(null);
              setSeleccion({ fecha, horaInicio, horaFin });
              setShowForm(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
