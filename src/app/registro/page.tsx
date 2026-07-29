"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { apiDelete, apiGet } from "@/lib/api-client";
import type { EventoCalendarioItem, RegistroTiempoItem } from "@/lib/types";
import { clienteIdDe } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import {
  diasLaborales,
  diasVentana3,
  formatDate,
  sumarMinutosSinSolapar,
  toDateOnlyISO,
  weekDays,
} from "@/lib/utils";
import { Button, ConfirmDialog, Modal, Select } from "@/components/ui";
import { TimeEntryForm } from "@/components/timetracking/time-entry-form";
import { TimerBar, type SeedRegistro } from "@/components/timetracking/timer-bar";
import { WeekCalendar, type VistaCalendario } from "@/components/timetracking/week-calendar";
import { CalendarioExternoForm } from "@/components/config/calendario-externo-form";

export default function RegistroPage() {
  const {
    clientesActivos: clientes,
    tareas,
    upsertTarea,
    tiposActivos: tipos,
    setTipos,
    estados,
    tema,
    calendarios,
    setCalendarios,
    loading: datosCargando,
    error: errorDatos,
  } = useAppData();
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [vista, setVista] = useState<VistaCalendario>("completa");
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
    comentarios?: string;
  } | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarAgregarCalendario, setMostrarAgregarCalendario] = useState(false);
  const [calendarioSeleccionado, setCalendarioSeleccionado] = useState<number | "">("");
  const [eventosExternos, setEventosExternos] = useState<EventoCalendarioItem[]>([]);

  const inicioSemana = (tema?.inicioSemana ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const dias = useMemo(() => {
    if (vista === "3dias") return diasVentana3(weekAnchor);
    if (vista === "laboral") return diasLaborales(weekAnchor);
    return weekDays(weekAnchor, inicioSemana);
  }, [weekAnchor, vista, inicioSemana]);
  const start = dias[0];
  const end = dias[dias.length - 1];
  const pasoDias = vista === "3dias" ? 3 : 7;

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

  const calendariosActivos = calendarios.filter((c) => c.activo);

  useEffect(() => {
    if (!mostrarCalendario) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpia eventos al ocultar el calendario
      setEventosExternos([]);
      return;
    }
    const params = new URLSearchParams({
      desde: toDateOnlyISO(start),
      hasta: toDateOnlyISO(end),
    });
    if (calendarioSeleccionado) params.set("calendarioId", String(calendarioSeleccionado));
    apiGet<EventoCalendarioItem[]>(`/api/calendarios/eventos?${params}`)
      .then(setEventosExternos)
      .catch(() => setEventosExternos([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on week/toggle/calendar change
  }, [mostrarCalendario, calendarioSeleccionado, start.getTime(), end.getTime()]);

  function mostrarCalendarioClick() {
    if (calendarios.length === 0) {
      setMostrarAgregarCalendario(true);
      return;
    }
    setMostrarCalendario(true);
  }

  function convertirEvento(evento: EventoCalendarioItem) {
    const inicio = new Date(evento.inicio);
    const fin = new Date(evento.fin);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditing(null);
    setSeleccion({
      fecha: toDateOnlyISO(inicio),
      horaInicio: `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`,
      horaFin: `${pad(fin.getHours())}:${pad(fin.getMinutes())}`,
      comentarios: evento.titulo,
    });
    setShowForm(true);
  }

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
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="shrink-0 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Registro de Trabajo
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            title="Semana anterior"
            className="px-2"
            onClick={() => setWeekAnchor((d) => addDays(d, -pasoDias))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
            {formatDate(start)} – {formatDate(end)}
          </span>
          <Button variant="secondary" onClick={() => setWeekAnchor(new Date())}>
            Hoy
          </Button>
          <Button
            variant="secondary"
            title="Semana siguiente"
            className="px-2"
            onClick={() => setWeekAnchor((d) => addDays(d, pasoDias))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="flex w-fit max-w-full shrink-0 flex-col gap-4">
        {datosListos && tema && (
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
        )}

        {!hayProyectos && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
            Necesitás crear al menos un cliente y un proyecto antes de cargar registros.
            Andá a Proyectos.
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Cliente</span>
          <Select
            className="w-40"
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
        </div>
        <span className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
          Total semana:{" "}
          <span className="font-medium">{totalHoras.toFixed(2)}h</span>
        </span>
        {mostrarCalendario ? (
          <div className="flex items-center gap-2">
            <Select
              className="w-40"
              value={calendarioSeleccionado}
              onChange={(e) =>
                setCalendarioSeleccionado(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Todos</option>
              {calendariosActivos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              title="Agregar calendario"
              className="px-2"
              onClick={() => setMostrarAgregarCalendario(true)}
            >
              <Plus size={14} />
            </Button>
            <Button
              variant="secondary"
              title="Ocultar calendario"
              className="px-2"
              onClick={() => setMostrarCalendario(false)}
            >
              <X size={14} />
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={mostrarCalendarioClick}>
            <CalendarDays size={14} /> Calendario
          </Button>
        )}
      </div>

      <Modal
        open={mostrarAgregarCalendario}
        onClose={() => setMostrarAgregarCalendario(false)}
        title="Nuevo calendario externo"
      >
        <CalendarioExternoForm
          onSaved={(calendario) => {
            setCalendarios((prev) => [...prev, calendario]);
            setMostrarAgregarCalendario(false);
            setMostrarCalendario(true);
          }}
          onCancel={() => setMostrarAgregarCalendario(false)}
        />
      </Modal>

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
            vista={vista}
            onVistaChange={setVista}
            horaInicioDefault={tema?.horaInicioGrilla}
            eventosExternos={eventosExternos}
            mostrarCalendario={mostrarCalendario}
            onConvertirEvento={convertirEvento}
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
