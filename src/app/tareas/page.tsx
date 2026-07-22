"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet } from "@/lib/api-client";
import type {
  ClienteItem,
  EstadoItem,
  Prioridad,
  ProyectoItem,
  TareaItem,
} from "@/lib/types";
import { PRIORIDAD_LABEL } from "@/lib/utils";
import { Button, Modal, MultiSelect } from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";
import { EstadoTaskGroup } from "@/components/tasks/estado-task-group";

const PRIORIDADES: Prioridad[] = ["URGENTE", "ALTA", "MEDIA", "BAJA"];

export default function TareasPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clienteIds, setClienteIds] = useState<number[]>([]);
  const [proyectoIds, setProyectoIds] = useState<number[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TareaItem | null>(null);
  const [colapsados, setColapsados] = useState<Set<number>>(new Set());

  function toggleColapsado(estadoId: number) {
    setColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(estadoId)) next.delete(estadoId);
      else next.add(estadoId);
      return next;
    });
  }

  const proyectosFiltrados = clienteIds.length
    ? proyectos.filter((p) => clienteIds.includes(p.clienteId))
    : proyectos;

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes"),
      apiGet<ProyectoItem[]>("/api/proyectos"),
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TareaItem[]>("/api/tareas"),
    ])
      .then(([c, p, e, t]) => {
        setClientes(c);
        setProyectos(p);
        setEstados(e);
        setTareas(t);
        const predeterminado = c.find((cl) => cl.predeterminado);
        if (predeterminado) setClienteIds([predeterminado.id]);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      if (clienteIds.length && !clienteIds.includes(t.proyecto?.clienteId ?? -1)) {
        return false;
      }
      if (proyectoIds.length && !proyectoIds.includes(t.proyectoId)) return false;
      if (prioridades.length && !prioridades.includes(t.prioridad)) return false;
      return true;
    });
  }, [tareas, clienteIds, proyectoIds, prioridades]);

  const estadosOrdenados = useMemo(
    () => [...estados].sort((a, b) => a.orden - b.orden),
    [estados],
  );

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
          disabled={proyectos.length === 0}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nueva tarea
        </Button>
      </div>

      {proyectos.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Necesitás crear al menos un cliente y un proyecto antes de agregar tareas.
          Andá a Proyectos.
        </p>
      )}

      <Modal
        open={(showForm || !!editing) && proyectos.length > 0}
        onClose={() => {
          setEditing(null);
          setShowForm(false);
        }}
        title={editing ? "Editar tarea" : "Nueva tarea"}
      >
        <TaskForm
          key={editing?.id ?? "new"}
          clientes={clientes}
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
      </Modal>

      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          className="w-40"
          label="Cliente"
          selected={clienteIds}
          onChange={(values) => {
            setClienteIds(values);
            setProyectoIds((prev) =>
              values.length
                ? prev.filter((id) =>
                    proyectos.some(
                      (p) => p.id === id && values.includes(p.clienteId),
                    ),
                  )
                : prev,
            );
          }}
          options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
        />
        <MultiSelect
          className="w-40"
          label="Proyecto"
          selected={proyectoIds}
          onChange={setProyectoIds}
          options={proyectosFiltrados.map((p) => ({ value: p.id, label: p.nombre }))}
        />
        <MultiSelect
          className="w-40"
          label="Prioridad"
          selected={prioridades}
          onChange={setPrioridades}
          options={PRIORIDADES.map((p) => ({ value: p, label: PRIORIDAD_LABEL[p] }))}
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <div className="space-y-3">
          {estadosOrdenados.map((estado) => (
            <EstadoTaskGroup
              key={estado.id}
              estado={estado}
              tareas={tareasFiltradas.filter((t) => t.estadoId === estado.id)}
              expanded={!colapsados.has(estado.id)}
              onToggle={() => toggleColapsado(estado.id)}
              onEdit={(tarea) => {
                setEditing(tarea);
                setShowForm(true);
              }}
              onDelete={eliminar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
