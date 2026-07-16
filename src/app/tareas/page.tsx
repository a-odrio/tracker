"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet } from "@/lib/api-client";
import type { ClienteItem, EstadoItem, Prioridad, TareaItem } from "@/lib/types";
import { PRIORIDAD_LABEL } from "@/lib/utils";
import { Button, Select } from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskTable } from "@/components/tasks/task-table";

export default function TareasPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clienteId, setClienteId] = useState<number | "">("");
  const [proyectoId, setProyectoId] = useState<number | "">("");
  const [estadoId, setEstadoId] = useState<number | "">("");
  const [prioridad, setPrioridad] = useState<Prioridad | "">("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TareaItem | null>(null);

  const proyectos = useMemo(
    () => clientes.flatMap((c) => c.proyectos ?? []),
    [clientes],
  );
  const proyectosFiltrados = clienteId
    ? proyectos.filter((p) => p.clienteId === clienteId)
    : proyectos;

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes"),
      apiGet<EstadoItem[]>("/api/estados"),
    ])
      .then(([c, e]) => {
        setClientes(c);
        setEstados(e);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  function cargarTareas() {
    setLoading(true);
    const params = new URLSearchParams();
    if (clienteId) params.set("clienteId", String(clienteId));
    if (proyectoId) params.set("proyectoId", String(proyectoId));
    if (estadoId) params.set("estadoId", String(estadoId));
    if (prioridad) params.set("prioridad", prioridad);
    apiGet<TareaItem[]>(`/api/tareas?${params.toString()}`)
      .then((data) => {
        setTareas(data);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data refetch on filter change
    cargarTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, proyectoId, estadoId, prioridad]);

  async function eliminar(tarea: TareaItem) {
    if (!confirm(`¿Eliminar la tarea "${tarea.nombre}"?`)) return;
    try {
      await apiDelete(`/api/tareas/${tarea.id}`);
      setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar las tareas: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Tareas
        </h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
        >
          {showForm && !editing ? "Cerrar" : "+ Nueva tarea"}
        </Button>
      </div>

      {showForm && !editing && proyectos.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Necesitás crear al menos un cliente y un proyecto antes de agregar tareas.
          Andá a Configuración.
        </p>
      )}

      {(showForm || editing) && proyectos.length > 0 && (
        <TaskForm
          key={editing?.id ?? "new"}
          proyectos={proyectos}
          estados={estados}
          tarea={editing ?? undefined}
          onSaved={(tarea) => {
            setTareas((prev) => {
              const exists = prev.some((t) => t.id === tarea.id);
              return exists
                ? prev.map((t) => (t.id === tarea.id ? tarea : t))
                : [...prev, tarea];
            });
            setEditing(null);
            setShowForm(false);
          }}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
      )}

      <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <Select
          className="w-44"
          value={clienteId}
          onChange={(e) => {
            setClienteId(e.target.value ? Number(e.target.value) : "");
            setProyectoId("");
          }}
        >
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select
          className="w-44"
          value={proyectoId}
          onChange={(e) =>
            setProyectoId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">Todos los proyectos</option>
          {proyectosFiltrados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={estadoId}
          onChange={(e) => setEstadoId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Todos los estados</option>
          {estados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as Prioridad | "")}
        >
          <option value="">Todas las prioridades</option>
          {(["URGENTE", "ALTA", "MEDIA", "BAJA"] as Prioridad[]).map((p) => (
            <option key={p} value={p}>
              {PRIORIDAD_LABEL[p]}
            </option>
          ))}
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
        ) : (
          <TaskTable
            tareas={tareas}
            onEdit={(tarea) => {
              setEditing(tarea);
              setShowForm(true);
            }}
            onDelete={eliminar}
          />
        )}
      </div>
    </div>
  );
}
