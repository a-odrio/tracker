"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api-client";
import type { ClienteItem, ProyectoItem, TemaItem } from "@/lib/types";
import { Button, ErrorText, Modal } from "@/components/ui";
import { ClienteCard } from "@/components/proyectos/cliente-card";
import { ClienteForm } from "@/components/proyectos/cliente-form";
import { ProyectoForm } from "@/components/proyectos/proyecto-form";

type ModalState =
  | { type: "cliente-new" }
  | { type: "cliente-edit"; cliente: ClienteItem }
  | { type: "proyecto-new"; clienteId: number }
  | { type: "proyecto-edit"; clienteId: number; proyecto: ProyectoItem }
  | null;

export default function ProyectosPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes?incluirArchivados=true"),
      apiGet<TemaItem>("/api/tema"),
    ])
      .then(([c, tm]) => {
        setClientes(c);
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
        ? prev.map((c) => (c.id === cliente.id ? { ...cliente, proyectos: c.proyectos } : c))
        : [...prev, { ...cliente, proyectos: [] }];
    });
  }

  function upsertProyecto(clienteId: number, proyecto: ProyectoItem) {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id !== clienteId) return c;
        const proyectos = c.proyectos ?? [];
        const existe = proyectos.some((p) => p.id === proyecto.id);
        return {
          ...c,
          proyectos: existe
            ? proyectos.map((p) => (p.id === proyecto.id ? proyecto : p))
            : [...proyectos, proyecto],
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

  async function toggleProyectoActivo(clienteId: number, proyecto: ProyectoItem) {
    setActionError("");
    try {
      const actualizado = await apiPatch<ProyectoItem>(`/api/proyectos/${proyecto.id}`, {
        activo: !proyecto.activo,
      });
      upsertProyecto(clienteId, actualizado);
      cerrarModal();
    } catch (e) {
      setActionError((e as Error).message);
    }
  }

  async function eliminarProyecto(clienteId: number, proyecto: ProyectoItem) {
    setActionError("");
    try {
      await apiDelete(`/api/proyectos/${proyecto.id}`);
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteId
            ? { ...c, proyectos: (c.proyectos ?? []).filter((p) => p.id !== proyecto.id) }
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
            onNuevoProyecto={() => setModal({ type: "proyecto-new", clienteId: cliente.id })}
            onEditProyecto={(proyecto) =>
              setModal({ type: "proyecto-edit", clienteId: cliente.id, proyecto })
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
          <ProyectoForm
            colorPrincipal={tema.colorPrincipal}
            clienteId={modal.clienteId}
            onSaved={(proyecto) => {
              upsertProyecto(modal.clienteId, proyecto);
              cerrarModal();
            }}
            onCancel={cerrarModal}
          />
        )}

        {modal?.type === "proyecto-edit" && (
          <>
            <ProyectoForm
              colorPrincipal={tema.colorPrincipal}
              clienteId={modal.clienteId}
              proyecto={modal.proyecto}
              onSaved={(proyecto) => {
                upsertProyecto(modal.clienteId, proyecto);
                cerrarModal();
              }}
              onCancel={cerrarModal}
            />
            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => toggleProyectoActivo(modal.clienteId, modal.proyecto)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {modal.proyecto.activo ? "Archivar" : "Activar"}
              </button>
              <button
                onClick={() => eliminarProyecto(modal.clienteId, modal.proyecto)}
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
