"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type {
  ClienteItem,
  EstadoItem,
  ProyectoItem,
  RegistroTiempoItem,
  TareaItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { timeToMinutes, toDateOnlyISO } from "@/lib/utils";
import {
  Button,
  ErrorText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { ProyectoForm } from "@/components/proyectos/proyecto-form";
import { TaskForm } from "@/components/tasks/task-form";

type SubVista = "form" | "nuevo-proyecto" | "nueva-tarea";

export function TimeEntryForm({
  clientes,
  proyectos,
  tareas,
  tipos,
  estados,
  colorPrincipal,
  registrosDelDia,
  registro,
  /** Cliente preseleccionado (ej. el filtro general de la pantalla). */
  clienteInicial,
  onProyectoCreated,
  onTareaCreated,
  onSaved,
  onCancel,
}: {
  clientes: ClienteItem[];
  proyectos: ProyectoItem[];
  tareas: TareaItem[];
  tipos: TipoTrabajoItem[];
  estados: EstadoItem[];
  colorPrincipal: string;
  registrosDelDia: RegistroTiempoItem[];
  registro?: RegistroTiempoItem;
  clienteInicial?: number;
  onProyectoCreated: (proyecto: ProyectoItem) => void;
  onTareaCreated: (tarea: TareaItem) => void;
  onSaved: (registro: RegistroTiempoItem) => void;
  onCancel?: () => void;
}) {
  const [subVista, setSubVista] = useState<SubVista>("form");
  const [fecha, setFecha] = useState(
    registro?.fecha.slice(0, 10) ?? toDateOnlyISO(new Date()),
  );

  const clienteIdInicial = registro
    ? (proyectos.find((p) => p.id === registro.proyectoId)?.clienteId ?? "")
    : (clienteInicial ??
      clientes.find((c) => c.predeterminado)?.id ??
      clientes[0]?.id ??
      "");
  const proyectosDelClienteInicial = proyectos.filter(
    (p) => p.clienteId === clienteIdInicial,
  );

  const [clienteId, setClienteId] = useState<number | "">(clienteIdInicial);
  const [proyectoId, setProyectoId] = useState(
    registro?.proyectoId ?? proyectosDelClienteInicial[0]?.id ?? proyectos[0]?.id ?? 0,
  );
  const [tareaId, setTareaId] = useState<number | "">(registro?.tareaId ?? "");
  const [tipoTrabajoId, setTipoTrabajoId] = useState(
    registro?.tipoTrabajoId ?? tipos[0]?.id ?? 0,
  );
  const [horaInicio, setHoraInicio] = useState(registro?.horaInicio ?? "09:00");
  const [horaFin, setHoraFin] = useState(registro?.horaFin ?? "10:00");
  const [comentarios, setComentarios] = useState(registro?.comentarios ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const proyectosFiltrados = proyectos.filter(
    (p) => !clienteId || p.clienteId === clienteId,
  );

  function cambiarCliente(id: number) {
    setClienteId(id);
    const disponibles = proyectos.filter((p) => p.clienteId === id);
    if (!disponibles.some((p) => p.id === proyectoId)) {
      setProyectoId(disponibles[0]?.id ?? 0);
      setTareaId("");
    }
  }

  const solapa = useMemo(() => {
    if (!horaInicio || !horaFin) return false;
    const inicio = timeToMinutes(horaInicio);
    const fin = timeToMinutes(horaFin);
    return registrosDelDia
      .filter((r) => r.id !== registro?.id && r.fecha.slice(0, 10) === fecha)
      .some((r) => {
        const rInicio = timeToMinutes(r.horaInicio);
        const rFin = timeToMinutes(r.horaFin);
        return inicio < rFin && fin > rInicio;
      });
  }, [horaInicio, horaFin, registrosDelDia, fecha, registro?.id]);

  async function guardar() {
    setError("");
    setSaving(true);
    const payload = {
      fecha,
      proyectoId: Number(proyectoId),
      tareaId: tareaId ? Number(tareaId) : null,
      tipoTrabajoId: Number(tipoTrabajoId),
      horaInicio,
      horaFin,
      comentarios: comentarios || null,
    };
    try {
      const resultado = registro
        ? await apiPatch<RegistroTiempoItem>(
            `/api/registros-tiempo/${registro.id}`,
            payload,
          )
        : await apiPost<RegistroTiempoItem>("/api/registros-tiempo", payload);
      onSaved(resultado);
      if (!registro) {
        setComentarios("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const tareasDisponibles = tareas.filter((t) => t.proyectoId === proyectoId);

  if (subVista === "nuevo-proyecto") {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setSubVista("form")}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Volver al registro
        </button>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Nuevo proyecto
        </h3>
        <ProyectoForm
          colorPrincipal={colorPrincipal}
          clientes={clientes}
          clienteId={clienteId || undefined}
          onSaved={(proyecto) => {
            onProyectoCreated(proyecto);
            setClienteId(proyecto.clienteId);
            setProyectoId(proyecto.id);
            setTareaId("");
            setSubVista("form");
          }}
          onCancel={() => setSubVista("form")}
        />
      </div>
    );
  }

  if (subVista === "nueva-tarea") {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setSubVista("form")}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Volver al registro
        </button>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Nueva tarea
        </h3>
        <TaskForm
          clientes={clientes}
          proyectos={proyectos}
          estados={estados}
          defaultProyectoId={proyectoId}
          onSaved={(tarea) => {
            onTareaCreated(tarea);
            setClienteId(
              proyectos.find((p) => p.id === tarea.proyectoId)?.clienteId ?? clienteId,
            );
            setProyectoId(tarea.proyectoId);
            setTareaId(tarea.id);
            setSubVista("form");
          }}
          onCancel={() => setSubVista("form")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label>Cliente</Label>
          <Select
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
          <div className="mb-1 flex items-center justify-between">
            <Label>Proyecto</Label>
            <button
              type="button"
              onClick={() => setSubVista("nuevo-proyecto")}
              className="flex items-center gap-0.5 text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              <Plus size={11} /> Nuevo
            </button>
          </div>
          <Select
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
          <div className="mb-1 flex items-center justify-between">
            <Label>Tarea (opcional)</Label>
            <button
              type="button"
              onClick={() => setSubVista("nueva-tarea")}
              disabled={!proyectoId}
              className="flex items-center gap-0.5 text-xs font-medium text-[var(--accent-primary)] hover:underline disabled:opacity-40"
            >
              <Plus size={11} /> Nueva
            </button>
          </div>
          <Select
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
          <Label>Tipo de trabajo</Label>
          <Select
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
        <div>
          <Label>Hora inicio</Label>
          <Input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
        <div>
          <Label>Hora fin</Label>
          <Input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <Label>Comentarios</Label>
          <Textarea
            rows={2}
            value={comentarios ?? ""}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </div>
      </div>
      {solapa && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          ⚠ Este horario se superpone con otro registro del mismo día. Podés guardarlo igual.
        </p>
      )}
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={saving || !proyectoId}>
          {registro ? "Guardar cambios" : "Agregar registro"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
