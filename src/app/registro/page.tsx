"use client";

import { useEffect, useMemo, useState } from "react";
import { addWeeks } from "date-fns";
import { apiDelete, apiGet } from "@/lib/api-client";
import type { RegistroTiempoItem } from "@/lib/types";
import { clienteIdDe } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import {
  formatDate,
  sumarMinutosSinSolapar,
  toDateOnlyISO,
  weekDays,
  weekRange,
} from "@/lib/utils";
import { Button, ConfirmDialog, Modal, Select } from "@/components/ui";
import { TimeEntryForm } from "@/components/timetracking/time-entry-form";
import { TimerBar, type SeedRegistro } from "@/components/timetracking/timer-bar";
import { WeekCalendar } from "@/components/timetracking/week-calendar";

export default function RegistroPage() {
  const {
    clientesActivos: clientes,
    tareas,
    upsertTarea,
    tiposActivos: tipos,
    setTipos,
    estados,
    tema,
    loading: datosCargando,
    error: errorDatos,
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
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

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
      .catch((e) => {
        setError((e as Error).message);
        setLoading(false);
      });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data refetch on week change
    cargarSemana();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.getTime(), end.getTime()]);

  function abrirRegistroManual(seed: SeedRegistro) {
    setEditing(null);
    setSeleccion(seed);
    setShowForm(true);
  }

  async function eliminar(registro: RegistroTiempoItem) {
    await apiDelete(`/api/registros-tiempo/${registro.id}`);
    setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
    setConfirmandoEliminar(false);
    setEditing(null);
    setSeleccion(null);
    setShowForm(false);
  }

  const registrosFiltrados = clienteFiltro
    ? registros.filter(
        (r) => r.tarea && clienteIdDe(r.tarea, tareas) === clienteFiltro,
      )
    : registros;

  const totalHoras = sumarMinutosSinSolapar(registrosFiltrados) / 60;

  if (error || errorDatos) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar el registro de tiempo: {error || errorDatos}
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
            avisoTimerHoras={tema.avisoTimerHoras}
            onTareaCreated={upsertTarea}
            onAbrirRegistro={abrirRegistroManual}
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
            onTareaCreated={upsertTarea}
            onTipoCreated={(tipo) => setTipos((prev) => [...prev, tipo])}
            onSaved={(registro) => {
              setRegistros((prev) => {
                const exists = prev.some((r) => r.id === registro.id);
                return exists
                  ? prev.map((r) => (r.id === registro.id ? registro : r))
                  : [...prev, registro];
              });
              if (registro.tarea) upsertTarea(registro.tarea);
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
              onClick={() => setConfirmandoEliminar(true)}
              className="mt-3 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Eliminar este registro
            </button>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={confirmandoEliminar}
        title="Eliminar registro"
        message="¿Eliminar este registro de tiempo?"
        confirmLabel="Eliminar"
        onConfirm={() => editing && eliminar(editing)}
        onCancel={() => setConfirmandoEliminar(false)}
      />

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
