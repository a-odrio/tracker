"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import type { ClienteItem, EstadoItem, Prioridad, TareaItem, TemaItem } from "@/lib/types";
import { padreRecienCerrado, raizDe } from "@/lib/tarea-tree";
import { PRIORIDAD_LABEL } from "@/lib/utils";
import { Button, InlineBanner, Modal, MultiSelect } from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";
import { EstadoTaskGroup } from "@/components/tasks/estado-task-group";

const PRIORIDADES: Prioridad[] = ["URGENTE", "ALTA", "MEDIA", "BAJA"];

export default function TareasPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clienteIds, setClienteIds] = useState<number[]>([]);
  const [proyectoIds, setProyectoIds] = useState<number[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TareaItem | null>(null);
  const [colapsados, setColapsados] = useState<Set<number>>(new Set());
  const [padreParaCerrar, setPadreParaCerrar] = useState<TareaItem | null>(null);

  function toggleColapsado(estadoId: number) {
    setColapsados((prev) => {
      const next = new Set(prev);
      if (next.has(estadoId)) next.delete(estadoId);
      else next.add(estadoId);
      return next;
    });
  }

  const raices = useMemo(() => tareas.filter((t) => t.parentId === null), [tareas]);
  const raicesFiltradas = clienteIds.length
    ? raices.filter((r) => r.clienteId != null && clienteIds.includes(r.clienteId))
    : raices;

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes"),
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<TemaItem>("/api/tema"),
    ])
      .then(([c, e, t, tm]) => {
        setClientes(c);
        setEstados(e);
        setTareas(t);
        setTema(tm);
        const predeterminado = c.find((cl) => cl.predeterminado);
        if (predeterminado) setClienteIds([predeterminado.id]);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) => {
      const raiz = raizDe(t, tareas);
      if (clienteIds.length && !clienteIds.includes(raiz.clienteId ?? -1)) {
        return false;
      }
      if (proyectoIds.length && !proyectoIds.includes(raiz.id)) return false;
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
          disabled={raices.length === 0}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nueva tarea
        </Button>
      </div>

      {raices.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Necesitás crear al menos un cliente y un proyecto antes de agregar tareas.
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

      <Modal
        open={(showForm || !!editing) && raices.length > 0 && !!tema}
        onClose={() => {
          setEditing(null);
          setShowForm(false);
        }}
        title={editing ? "Editar tarea" : "Nueva tarea"}
      >
        {tema && (
        <TaskForm
          key={editing?.id ?? "new"}
          clientes={clientes}
          tareas={tareas}
          estados={estados}
          colorPrincipal={tema.colorPrincipal}
          tarea={editing ?? undefined}
          onSaved={(tarea) => {
            const antes = tareas;
            const exists = antes.some((t) => t.id === tarea.id);
            const nuevas = exists
              ? antes.map((t) => (t.id === tarea.id ? tarea : t))
              : [...antes, tarea];
            setTareas(nuevas);
            const padre = padreRecienCerrado(tarea.id, antes, nuevas);
            if (padre) setPadreParaCerrar(padre);
          }}
          onDone={() => {
            setEditing(null);
            setShowForm(false);
          }}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
        )}
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
                    raices.some((r) => r.id === id && values.includes(r.clienteId ?? -1)),
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
          options={raicesFiltradas.map((r) => ({ value: r.id, label: r.nombre }))}
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
              tareas={tareas}
              estado={estado}
              tareasDelEstado={tareas.filter((t) => t.estadoId === estado.id)}
              tareasVisibles={tareasFiltradas.filter((t) => t.estadoId === estado.id)}
              expanded={!colapsados.has(estado.id)}
              onToggle={() => toggleColapsado(estado.id)}
              onReorder={(nuevasDelEstado) => {
                setTareas((prev) => [
                  ...prev.filter((t) => t.estadoId !== estado.id),
                  ...nuevasDelEstado,
                ]);
              }}
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
