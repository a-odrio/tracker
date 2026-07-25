"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { apiDelete, apiPatch } from "@/lib/api-client";
import type { ClienteItem, TareaItem } from "@/lib/types";
import { padreRecienCerrado } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import { Button, ErrorText, InlineBanner, Modal } from "@/components/ui";
import { ClienteSeccion } from "@/components/proyectos/cliente-seccion";
import { ClienteForm } from "@/components/proyectos/cliente-form";
import { TaskForm } from "@/components/tasks/task-form";

type ModalState =
  | { type: "cliente-new" }
  | { type: "cliente-edit"; cliente: ClienteItem }
  | { type: "proyecto-new"; clienteId: number }
  | { type: "tarea-edit"; tarea: TareaItem }
  | null;

export default function ProyectosPage() {
  const { clientes, setClientes, tareas, setTareas, estados, tema, loading, error } =
    useAppData();
  const [modal, setModal] = useState<ModalState>(null);
  const [actionError, setActionError] = useState("");
  const [padreParaCerrar, setPadreParaCerrar] = useState<TareaItem | null>(null);
  const [mostrarFinalizadas, setMostrarFinalizadas] = useState(false);

  function cerrarModal() {
    setModal(null);
    setActionError("");
  }

  function upsertCliente(cliente: ClienteItem) {
    setClientes((prev) => {
      const existe = prev.some((c) => c.id === cliente.id);
      return existe ? prev.map((c) => (c.id === cliente.id ? cliente : c)) : [...prev, cliente];
    });
  }

  /** Sincroniza cualquier tarea creada/editada/reordenada (raíz o subtarea,
   * cualquier profundidad) y detecta si con ese cambio un padre se quedó
   * sin subtareas abiertas. */
  function onTareaGuardada(tarea: TareaItem) {
    setTareas((prev) => {
      const existe = prev.some((t) => t.id === tarea.id);
      const nuevas = existe
        ? prev.map((t) => (t.id === tarea.id ? tarea : t))
        : [...prev, tarea];
      const padre = padreRecienCerrado(tarea.id, prev, nuevas);
      if (padre) setPadreParaCerrar(padre);
      return nuevas;
    });
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

  async function toggleClienteActivo(cliente: ClienteItem) {
    setActionError("");
    try {
      const actualizado = await apiPatch<ClienteItem>(`/api/clientes/${cliente.id}`, {
        activo: !cliente.activo,
      });
      upsertCliente(actualizado);
      cerrarModal();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function toggleClientePredeterminado(cliente: ClienteItem) {
    try {
      const actualizado = await apiPatch<ClienteItem>(`/api/clientes/${cliente.id}`, {
        predeterminado: !cliente.predeterminado,
      });
      setClientes((prev) =>
        prev.map((c) => {
          if (c.id === actualizado.id) return actualizado;
          return c.predeterminado ? { ...c, predeterminado: false } : c;
        }),
      );
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function eliminarCliente(cliente: ClienteItem) {
    setActionError("");
    try {
      await apiDelete(`/api/clientes/${cliente.id}`);
      setClientes((prev) => prev.filter((c) => c.id !== cliente.id));
      cerrarModal();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function toggleTareaActiva(tarea: TareaItem) {
    setActionError("");
    try {
      const actualizado = await apiPatch<TareaItem>(`/api/tareas/${tarea.id}`, {
        activo: !tarea.activo,
      });
      onTareaGuardada(actualizado);
      cerrarModal();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function eliminarTarea(tarea: TareaItem) {
    setActionError("");
    try {
      await apiDelete(`/api/tareas/${tarea.id}`);
      setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
      cerrarModal();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar los proyectos: {error}
      </p>
    );
  }

  if (loading || !tema) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>;
  }

  const tituloModal =
    modal?.type === "cliente-new"
      ? "Nuevo cliente"
      : modal?.type === "cliente-edit"
        ? "Editar cliente"
        : modal?.type === "proyecto-new"
          ? "Nuevo proyecto"
          : modal?.type === "tarea-edit"
            ? "Editar tarea"
            : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Proyectos
        </h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={mostrarFinalizadas}
              onChange={(e) => setMostrarFinalizadas(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            Mostrar finalizadas
          </label>
          <Button onClick={() => setModal({ type: "cliente-new" })}>
            <Plus size={15} /> Nuevo cliente
          </Button>
        </div>
      </div>

      {clientes.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay clientes. Creá el primero con el botón de arriba.
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

      <div className="space-y-4">
        {clientes.map((cliente) => (
          <ClienteSeccion
            key={cliente.id}
            cliente={cliente}
            tareas={tareas}
            estados={estados}
            mostrarFinalizadas={mostrarFinalizadas}
            onEditCliente={() => setModal({ type: "cliente-edit", cliente })}
            onTogglePredeterminado={() => toggleClientePredeterminado(cliente)}
            onNuevoProyecto={() => setModal({ type: "proyecto-new", clienteId: cliente.id })}
            onEditar={(tarea) => setModal({ type: "tarea-edit", tarea })}
            onTareaCreated={onTareaGuardada}
            onTareaSincronizada={onTareaGuardada}
          />
        ))}
      </div>

      <Modal open={modal !== null} onClose={cerrarModal} title={tituloModal}>
        {modal?.type === "cliente-new" && (
          <ClienteForm
            colorPrincipal={tema.colorPrincipal}
            onSaved={(cliente) => {
              upsertCliente(cliente);
              cerrarModal();
            }}
            onCancel={cerrarModal}
          />
        )}

        {modal?.type === "cliente-edit" && (
          <>
            <ClienteForm
              colorPrincipal={tema.colorPrincipal}
              cliente={modal.cliente}
              onSaved={(cliente) => {
                upsertCliente(cliente);
                cerrarModal();
              }}
              onCancel={cerrarModal}
            />
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => toggleClienteActivo(modal.cliente)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {modal.cliente.activo ? "Archivar" : "Activar"}
              </button>
              <button
                onClick={() => eliminarCliente(modal.cliente)}
                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Eliminar
              </button>
            </div>
            <ErrorText>{actionError}</ErrorText>
          </>
        )}

        {modal?.type === "proyecto-new" && (
          <TaskForm
            colorPrincipal={tema.colorPrincipal}
            clienteId={modal.clienteId}
            tareas={tareas}
            estados={estados}
            parentId={null}
            onSaved={onTareaGuardada}
            onDone={cerrarModal}
            onCancel={cerrarModal}
          />
        )}

        {modal?.type === "tarea-edit" && (
          <>
            <TaskForm
              colorPrincipal={tema.colorPrincipal}
              tareas={tareas}
              estados={estados}
              tarea={modal.tarea}
              onSaved={onTareaGuardada}
              onDone={cerrarModal}
              onCancel={cerrarModal}
            />
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => toggleTareaActiva(modal.tarea)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {modal.tarea.activo ? "Archivar" : "Activar"}
              </button>
              <button
                onClick={() => eliminarTarea(modal.tarea)}
                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Eliminar
              </button>
            </div>
            <ErrorText>{actionError}</ErrorText>
          </>
        )}
      </Modal>
    </div>
  );
}
