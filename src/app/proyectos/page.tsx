"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import type { ClienteItem, EstadoItem, TareaItem, TemaItem } from "@/lib/types";
import { Button, ErrorText, Modal } from "@/components/ui";
import { ClienteCard } from "@/components/proyectos/cliente-card";
import { ClienteForm } from "@/components/proyectos/cliente-form";
import { TaskForm } from "@/components/tasks/task-form";

type ModalState =
  | { type: "cliente-new" }
  | { type: "cliente-edit"; cliente: ClienteItem }
  | { type: "proyecto-new"; clienteId: number }
  | { type: "proyecto-edit"; clienteId: number; proyecto: TareaItem }
  | null;

export default function ProyectosPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes?incluirArchivados=true"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TemaItem>("/api/tema"),
    ])
      .then(([c, t, e, tm]) => {
        setClientes(c);
        setTareas(t);
        setEstados(e);
        setTema(tm);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  function cerrarModal() {
    setModal(null);
    setActionError("");
  }

  function upsertCliente(cliente: ClienteItem) {
    setClientes((prev) => {
      const existe = prev.some((c) => c.id === cliente.id);
      return existe
        ? prev.map((c) => (c.id === cliente.id ? { ...cliente, tareas: c.tareas } : c))
        : [...prev, { ...cliente, tareas: [] }];
    });
  }

  function upsertTareaRaiz(clienteId: number, tarea: TareaItem) {
    setTareas((prev) => {
      const existe = prev.some((t) => t.id === tarea.id);
      return existe ? prev.map((t) => (t.id === tarea.id ? tarea : t)) : [...prev, tarea];
    });
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== clienteId) return c;
        const raices = c.tareas ?? [];
        const existe = raices.some((t) => t.id === tarea.id);
        return {
          ...c,
          tareas: existe
            ? raices.map((t) => (t.id === tarea.id ? tarea : t))
            : [...raices, tarea],
        };
      }),
    );
  }

  function reordenarTareasRaiz(clienteId: number, raicesActivas: TareaItem[]) {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== clienteId) return c;
        const archivadas = (c.tareas ?? []).filter((t) => !t.activo);
        return {
          ...c,
          tareas: [...raicesActivas.map((t, i) => ({ ...t, orden: i })), ...archivadas],
        };
      }),
    );
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
          if (c.id === actualizado.id) return { ...actualizado, tareas: c.tareas };
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

  async function toggleTareaActiva(clienteId: number, tarea: TareaItem) {
    setActionError("");
    try {
      const actualizado = await apiPatch<TareaItem>(`/api/tareas/${tarea.id}`, {
        activo: !tarea.activo,
      });
      upsertTareaRaiz(clienteId, actualizado);
      cerrarModal();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function eliminarTareaRaiz(clienteId: number, tarea: TareaItem) {
    setActionError("");
    try {
      await apiDelete(`/api/tareas/${tarea.id}`);
      setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteId
            ? { ...c, tareas: (c.tareas ?? []).filter((t) => t.id !== tarea.id) }
            : c,
        ),
      );
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
          : modal?.type === "proyecto-edit"
            ? "Editar proyecto"
            : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Proyectos
        </h1>
        <Button onClick={() => setModal({ type: "cliente-new" })}>
          <Plus size={15} /> Nuevo cliente
        </Button>
      </div>

      {clientes.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay clientes. Creá el primero con el botón de arriba.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((cliente) => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            onEditCliente={() => setModal({ type: "cliente-edit", cliente })}
            onTogglePredeterminado={() => toggleClientePredeterminado(cliente)}
            onNuevoProyecto={() => setModal({ type: "proyecto-new", clienteId: cliente.id })}
            onEditProyecto={(proyecto) =>
              setModal({ type: "proyecto-edit", clienteId: cliente.id, proyecto })
            }
            onReorderProyectos={(raicesActivas) =>
              reordenarTareasRaiz(cliente.id, raicesActivas)
            }
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
            onSaved={(proyecto) => upsertTareaRaiz(modal.clienteId, proyecto)}
            onDone={cerrarModal}
            onCancel={cerrarModal}
          />
        )}

        {modal?.type === "proyecto-edit" && (
          <>
            <TaskForm
              colorPrincipal={tema.colorPrincipal}
              clienteId={modal.clienteId}
              tareas={tareas}
              estados={estados}
              tarea={modal.proyecto}
              onSaved={(proyecto) => upsertTareaRaiz(modal.clienteId, proyecto)}
              onDone={cerrarModal}
              onCancel={cerrarModal}
            />
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => toggleTareaActiva(modal.clienteId, modal.proyecto)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {modal.proyecto.activo ? "Archivar" : "Activar"}
              </button>
              <button
                onClick={() => eliminarTareaRaiz(modal.clienteId, modal.proyecto)}
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
