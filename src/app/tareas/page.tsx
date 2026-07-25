"use client";

import { useEffect, useMemo, useState } from "react";
import { apiDelete } from "@/lib/api-client";
import type { Prioridad, TareaItem } from "@/lib/types";
import { esHojaEfectiva, raizDe } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import { PRIORIDAD_LABEL } from "@/lib/utils";
import { Button, ConfirmDialog, ErrorText, Modal, MultiSelect } from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";
import { EstadoTaskGroup } from "@/components/tasks/estado-task-group";

const PRIORIDADES: Prioridad[] = ["URGENTE", "ALTA", "MEDIA", "BAJA"];

export default function TareasPage() {
  const {
    clientesActivos: clientes,
    estados,
    tareas,
    setTareas,
    upsertTarea,
    tema,
    loading,
    error,
  } = useAppData();

  const [clienteIds, setClienteIds] = useState<number[]>([]);
  const [proyectoIds, setProyectoIds] = useState<number[]>([]);
  const [prioridades, setPrioridades] = useState<Prioridad[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TareaItem | null>(null);
  const [colapsados, setColapsados] = useState<Set<number>>(new Set());
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<TareaItem | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");

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
    const predeterminado = clientes.find((cl) => cl.predeterminado);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preselect once clientes load
    if (predeterminado) setClienteIds([predeterminado.id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes.length]);

  // Solo se listan las hojas efectivas (sin hijos, o con todos los hijos ya
  // finalizados) — un proyecto/tarea con subtareas todavía abiertas es un
  // contenedor puro y no aparece acá, igual que en Kanban y en el backlog.
  const tareasHojaEfectiva = useMemo(
    () => tareas.filter((t) => esHojaEfectiva(t, tareas)),
    [tareas],
  );

  const tareasFiltradas = useMemo(() => {
    return tareasHojaEfectiva.filter((t) => {
      const raiz = raizDe(t, tareas);
      if (clienteIds.length && !clienteIds.includes(raiz.clienteId ?? -1)) {
        return false;
      }
      if (proyectoIds.length && !proyectoIds.includes(raiz.id)) return false;
      if (prioridades.length && !prioridades.includes(t.prioridad)) return false;
      return true;
    });
  }, [tareasHojaEfectiva, tareas, clienteIds, proyectoIds, prioridades]);

  const estadosOrdenados = useMemo(
    () => [...estados].sort((a, b) => a.orden - b.orden),
    [estados],
  );

  async function eliminar(tarea: TareaItem) {
    setErrorEliminar("");
    try {
      await apiDelete(`/api/tareas/${tarea.id}`);
      setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
      setConfirmandoEliminar(null);
    } catch (e) {
      setErrorEliminar((e as Error).message);
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
          disabled={raices.length === 0}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nueva tarea
        </Button>
      </div>

      <ErrorText>{errorEliminar}</ErrorText>

      {raices.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Necesitás crear al menos un cliente y un proyecto antes de agregar tareas.
          Andá a Proyectos.
        </p>
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
          onSaved={upsertTarea}
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
              tareasDelEstado={tareasHojaEfectiva.filter((t) => t.estadoId === estado.id)}
              tareasVisibles={tareasFiltradas.filter((t) => t.estadoId === estado.id)}
              expanded={!colapsados.has(estado.id)}
              onToggle={() => toggleColapsado(estado.id)}
              onReorder={(nuevasDelEstado) => {
                const idsReordenados = new Set(nuevasDelEstado.map((t) => t.id));
                setTareas((prev) => [
                  ...prev.filter((t) => !idsReordenados.has(t.id)),
                  ...nuevasDelEstado,
                ]);
              }}
              onEdit={(tarea) => {
                setEditing(tarea);
                setShowForm(true);
              }}
              onDelete={(tarea) => setConfirmandoEliminar(tarea)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmandoEliminar}
        title="Eliminar tarea"
        message={
          confirmandoEliminar
            ? `¿Eliminar la tarea "${confirmandoEliminar.nombre}"?`
            : ""
        }
        confirmLabel="Eliminar"
        onConfirm={() => confirmandoEliminar && eliminar(confirmandoEliminar)}
        onCancel={() => setConfirmandoEliminar(null)}
      />
    </div>
  );
}
