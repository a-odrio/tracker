"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Clock, Play, Plus, Square, X } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type {
  ClienteItem,
  EstadoItem,
  TareaItem,
  TimerActivoItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { raizDe } from "@/lib/tarea-tree";
import { minutesToTime, timeToMinutes, toDateOnlyISO } from "@/lib/utils";
import { Button, ConfirmDialog, ErrorText, Select } from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";
import { TareaPicker } from "@/components/tasks/tarea-picker";
import { useClienteProyectoSelector } from "@/components/timetracking/use-cliente-proyecto-selector";
import { SubVistaPanel } from "@/components/timetracking/subvista-panel";

type SubVista = "form" | "nuevo-proyecto";

export type SeedRegistro = {
  tareaId?: number;
  tipoTrabajoId?: number;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
};

function formatElapsed(ms: number) {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Calcula fecha/horaInicio/horaFin para el registro que deja un timer al
 * detenerse, con una duración mínima de 1 minuto y recorte a 23:59 si llegó
 * a cruzar la medianoche (RegistroTiempo no soporta abarcar dos días). */
function horasParaDetener(inicio: Date, fin: Date) {
  const mismoDia = inicio.toDateString() === fin.toDateString();
  const pad = (n: number) => String(n).padStart(2, "0");
  const horaInicio = `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`;
  let horaFin = mismoDia ? `${pad(fin.getHours())}:${pad(fin.getMinutes())}` : "23:59";
  if (timeToMinutes(horaFin) <= timeToMinutes(horaInicio)) {
    horaFin = minutesToTime(Math.min(timeToMinutes(horaInicio) + 1, 23 * 60 + 59));
  }
  return { fecha: toDateOnlyISO(inicio), horaInicio, horaFin };
}

export function TimerBar({
  clientes,
  tareas,
  tipos,
  estados,
  colorPrincipal,
  clienteInicial,
  onTareaCreated,
  onAbrirRegistro,
  floating = false,
}: {
  clientes: ClienteItem[];
  tareas: TareaItem[];
  tipos: TipoTrabajoItem[];
  estados: EstadoItem[];
  colorPrincipal: string;
  clienteInicial?: number;
  onTareaCreated: (tarea: TareaItem) => void;
  /** Abre el formulario de registro manual (nuevo o para revisar lo que dejó el timer). */
  onAbrirRegistro: (seed: SeedRegistro) => void;
  /** Modo pastilla flotante (widget global): colapsado a un botón chico
   * cuando no hay timer corriendo, se expande al hacer click; con timer
   * corriendo siempre muestra la fila compacta, sin colapsar. */
  floating?: boolean;
}) {
  const [subVista, setSubVista] = useState<SubVista>("form");
  const [expandidoFloat, setExpandidoFloat] = useState(false);
  const [timer, setTimer] = useState<TimerActivoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  // El id inicial de tarea replica el de proyecto (loguear "contra el
  // proyecto en general" por defecto) — se recalcula solo una vez, en el
  // primer render; después lo maneja `onProyectoCambiado` más abajo.
  const clienteIdInicial =
    clienteInicial ?? clientes.find((c) => c.predeterminado)?.id ?? clientes[0]?.id ?? "";
  const proyectoIdInicial =
    tareas.find((t) => t.parentId === null && t.clienteId === clienteIdInicial)?.id ?? 0;
  const [tareaId, setTareaId] = useState<number>(proyectoIdInicial);
  const {
    clienteId,
    setClienteId,
    proyectoId,
    setProyectoId,
    proyectosFiltrados,
    cambiarCliente,
    cambiarProyecto,
  } = useClienteProyectoSelector({
    clientes,
    tareas,
    clienteInicial,
    onProyectoCambiado: setTareaId,
  });
  const [tipoTrabajoId, setTipoTrabajoId] = useState(tipos[0]?.id ?? 0);

  useEffect(() => {
    apiGet<TimerActivoItem | null>("/api/timer")
      .then((t) => setTimer(t))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const proyectoActual = tareas.find((t) => t.id === proyectoId);

  async function iniciar() {
    setError("");
    setStarting(true);
    try {
      const nuevo = await apiPost<TimerActivoItem>("/api/timer", {
        tareaId,
        tipoTrabajoId,
      });
      setTimer(nuevo);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  async function detener() {
    if (!timer) return;
    setError("");
    setStopping(true);
    try {
      const { fecha, horaInicio, horaFin } = horasParaDetener(
        new Date(timer.inicio),
        new Date(),
      );
      await apiDelete("/api/timer");
      setTimer(null);
      onAbrirRegistro({
        tareaId: timer.tareaId,
        tipoTrabajoId: timer.tipoTrabajoId,
        fecha,
        horaInicio,
        horaFin,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStopping(false);
    }
  }

  async function descartar() {
    await apiDelete("/api/timer");
    setTimer(null);
    setConfirmandoDescarte(false);
  }

  if (loading) {
    if (floating) return null;
    return (
      <div className="h-[60px] rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  if (subVista === "nuevo-proyecto") {
    return (
      <SubVistaPanel titulo="Nuevo proyecto" contenedor onVolver={() => setSubVista("form")}>
        <TaskForm
          colorPrincipal={colorPrincipal}
          clientes={clientes}
          clienteId={clienteId || undefined}
          tareas={tareas}
          estados={estados}
          parentId={null}
          onSaved={(proyecto) => {
            onTareaCreated(proyecto);
            setClienteId(proyecto.clienteId ?? clienteId);
            setProyectoId(proyecto.id);
            setTareaId(proyecto.id);
          }}
          onDone={() => setSubVista("form")}
          onCancel={() => setSubVista("form")}
        />
      </SubVistaPanel>
    );
  }

  if (timer) {
    const elapsedMs = now - new Date(timer.inicio).getTime();
    const raizTimer = timer.tarea ? raizDe(timer.tarea, tareas) : undefined;
    return (
      <div
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-[var(--accent-primary)] bg-white p-3 dark:bg-slate-900 ${floating ? "w-[320px] shadow-lg" : ""}`}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {timer.tarea && timer.tarea.id !== raizTimer?.id
              ? timer.tarea.nombre
              : "Sin tarea específica"}
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {raizTimer?.cliente?.nombre} · {raizTimer?.nombre} · {timer.tipoTrabajo?.nombre}
          </div>
        </div>
        <div className="font-mono text-lg tabular-nums text-slate-900 dark:text-slate-100">
          {formatElapsed(elapsedMs)}
        </div>
        <Button
          onClick={detener}
          disabled={stopping}
          title="Detener y revisar el registro"
          className="px-2"
        >
          <Square size={14} />
        </Button>
        <button
          onClick={() => setConfirmandoDescarte(true)}
          title="Descartar sin guardar"
          className="shrink-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <X size={16} />
        </button>
        <button
          onClick={() =>
            onAbrirRegistro({
              tareaId: timer.tareaId,
              tipoTrabajoId: timer.tipoTrabajoId,
            })
          }
          title="Nuevo registro manual"
          className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <CalendarPlus size={18} />
        </button>
        <ErrorText>{error}</ErrorText>
        <ConfirmDialog
          open={confirmandoDescarte}
          title="Descartar timer"
          message="¿Descartar el timer sin guardar un registro?"
          confirmLabel="Descartar"
          onConfirm={descartar}
          onCancel={() => setConfirmandoDescarte(false)}
        />
      </div>
    );
  }

  if (floating && !expandidoFloat) {
    return (
      <button
        type="button"
        onClick={() => setExpandidoFloat(true)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-lg hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Clock size={14} /> Timer
      </button>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 ${floating ? "relative w-[320px] shadow-lg" : ""}`}
    >
      {floating && (
        <button
          type="button"
          onClick={() => setExpandidoFloat(false)}
          title="Contraer"
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-slate-100"
        >
          <X size={13} />
        </button>
      )}
      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Cliente</label>
        <Select
          className="w-36"
          value={clienteId}
          onChange={(e) => cambiarCliente(Number(e.target.value))}
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Proyecto</label>
          <button
            type="button"
            onClick={() => setSubVista("nuevo-proyecto")}
            title="Nuevo proyecto"
            className="text-[var(--accent-primary)] hover:opacity-70"
          >
            <Plus size={12} />
          </button>
        </div>
        <Select
          className="w-40"
          value={proyectoId}
          onChange={(e) => cambiarProyecto(Number(e.target.value))}
        >
          {proyectosFiltrados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Tarea</label>
        {proyectoActual ? (
          <TareaPicker
            proyecto={proyectoActual}
            tareas={tareas}
            estados={estados}
            tareaId={tareaId}
            onSeleccionar={setTareaId}
            onTareaCreated={onTareaCreated}
            className="w-40"
          />
        ) : (
          <div className="flex h-[34px] w-40 items-center rounded-md border border-slate-200 px-2.5 text-sm text-slate-400 dark:border-slate-800">
            Sin proyecto
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
          Tipo de trabajo
        </label>
        <Select
          className="w-36"
          value={tipoTrabajoId}
          onChange={(e) => setTipoTrabajoId(Number(e.target.value))}
        >
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
      </div>
      <Button
        onClick={iniciar}
        disabled={starting || !proyectoId || !tipoTrabajoId}
        title="Iniciar timer"
        className="px-2"
      >
        <Play size={14} />
      </Button>
      <button
        onClick={() => onAbrirRegistro({ tareaId, tipoTrabajoId })}
        disabled={!proyectoId}
        title="Nuevo registro manual"
        className="shrink-0 text-slate-400 hover:text-slate-700 disabled:opacity-40 dark:hover:text-slate-200"
      >
        <CalendarPlus size={20} />
      </button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
