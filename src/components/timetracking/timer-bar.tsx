"use client";

import { useEffect, useState } from "react";
import { Play, Square, X } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type {
  ClienteItem,
  ProyectoItem,
  RegistroTiempoItem,
  TareaItem,
  TimerActivoItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { Button, ErrorText, Select } from "@/components/ui";

function formatElapsed(ms: number) {
  const totalSeg = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerBar({
  clientes,
  proyectos,
  tareas,
  tipos,
  clienteInicial,
  onRegistroCreado,
}: {
  clientes: ClienteItem[];
  proyectos: ProyectoItem[];
  tareas: TareaItem[];
  tipos: TipoTrabajoItem[];
  clienteInicial?: number;
  onRegistroCreado: (registro: RegistroTiempoItem) => void;
}) {
  const [timer, setTimer] = useState<TimerActivoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const clienteIdInicial =
    clienteInicial ?? clientes.find((c) => c.predeterminado)?.id ?? clientes[0]?.id ?? "";
  const [clienteId, setClienteId] = useState<number | "">(clienteIdInicial);
  const proyectosDelClienteInicial = proyectos.filter((p) => p.clienteId === clienteIdInicial);
  const [proyectoId, setProyectoId] = useState(proyectosDelClienteInicial[0]?.id ?? 0);
  const [tareaId, setTareaId] = useState<number | "">("");
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

  const proyectosFiltrados = proyectos.filter((p) => !clienteId || p.clienteId === clienteId);
  const tareasDisponibles = tareas.filter(
    (t) => t.proyectoId === proyectoId && !t.estado?.esFinal,
  );

  function cambiarCliente(id: number) {
    setClienteId(id);
    const disponibles = proyectos.filter((p) => p.clienteId === id);
    if (!disponibles.some((p) => p.id === proyectoId)) {
      setProyectoId(disponibles[0]?.id ?? 0);
      setTareaId("");
    }
  }

  async function iniciar() {
    setError("");
    setStarting(true);
    try {
      const nuevo = await apiPost<TimerActivoItem>("/api/timer", {
        proyectoId,
        tareaId: tareaId || null,
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
    setError("");
    setStopping(true);
    try {
      const registro = await apiPost<RegistroTiempoItem>("/api/timer/detener", {});
      setTimer(null);
      onRegistroCreado(registro);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStopping(false);
    }
  }

  async function descartar() {
    if (!confirm("¿Descartar el timer sin guardar un registro?")) return;
    await apiDelete("/api/timer");
    setTimer(null);
  }

  if (loading) {
    return (
      <div className="h-[60px] rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  if (timer) {
    const elapsedMs = now - new Date(timer.inicio).getTime();
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--accent-primary)] bg-white p-3 dark:bg-slate-900">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {timer.tarea?.nombre ?? "Sin tarea específica"}
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {timer.proyecto?.cliente?.nombre} · {timer.proyecto?.nombre} ·{" "}
            {timer.tipoTrabajo?.nombre}
          </div>
        </div>
        <div className="font-mono text-lg tabular-nums text-slate-900 dark:text-slate-100">
          {formatElapsed(elapsedMs)}
        </div>
        <Button onClick={detener} disabled={stopping}>
          <Square size={14} /> Detener
        </Button>
        <button
          onClick={descartar}
          title="Descartar sin guardar"
          className="shrink-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
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
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Proyecto</label>
        <Select
          className="w-40"
          value={proyectoId}
          onChange={(e) => {
            setProyectoId(Number(e.target.value));
            setTareaId("");
          }}
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
        <Select
          className="w-40"
          value={tareaId}
          onChange={(e) => setTareaId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Sin tarea específica</option>
          {tareasDisponibles.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
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
      <Button onClick={iniciar} disabled={starting || !proyectoId || !tipoTrabajoId}>
        <Play size={14} /> Iniciar
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
