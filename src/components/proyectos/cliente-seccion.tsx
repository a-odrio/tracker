"use client";

import { useState } from "react";
import { ChevronRight, Pencil, Plus, Star } from "lucide-react";
import type { ClienteItem, EstadoItem, TareaItem } from "@/lib/types";
import { TareaArbolLista } from "@/components/proyectos/tarea-arbol";

/**
 * Sección de ancho completo, contraíble, con todos los proyectos (tareas
 * raíz) de un cliente y su árbol completo de subtareas — reemplaza la
 * grilla de cards que mostraba solo un nivel.
 */
export function ClienteSeccion({
  cliente,
  tareas,
  estados,
  mostrarFinalizadas,
  onEditCliente,
  onTogglePredeterminado,
  onNuevoProyecto,
  onEditar,
  onTareaCreated,
  onTareaSincronizada,
}: {
  cliente: ClienteItem;
  /** Lista plana completa (todos los clientes, toda profundidad). */
  tareas: TareaItem[];
  estados: EstadoItem[];
  mostrarFinalizadas: boolean;
  onEditCliente: () => void;
  onTogglePredeterminado: () => void;
  onNuevoProyecto: () => void;
  onEditar: (tarea: TareaItem) => void;
  onTareaCreated: (tarea: TareaItem) => void;
  onTareaSincronizada: (tarea: TareaItem) => void;
}) {
  const [expandido, setExpandido] = useState(true);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const raicesDelCliente = tareas.filter(
    (t) => t.parentId === null && t.clienteId === cliente.id,
  );
  const activos = [...raicesDelCliente.filter((p) => p.activo)].sort(
    (a, b) => a.orden - b.orden,
  );
  const archivados = [...raicesDelCliente.filter((p) => !p.activo)].sort(
    (a, b) => a.orden - b.orden,
  );
  const estadoInicialId = estados.find((e) => e.esInicial)?.id ?? estados[0]?.id ?? 0;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
        cliente.activo ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          title={expandido ? "Contraer" : "Expandir"}
          className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <ChevronRight size={16} className={`transition-transform ${expandido ? "rotate-90" : ""}`} />
        </button>
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: cliente.color }}
        />
        <h2 className="flex-1 truncate font-semibold text-slate-900 dark:text-slate-100">
          {cliente.nombre}
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {activos.length} proyecto{activos.length === 1 ? "" : "s"}
        </span>
        {!cliente.activo && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Archivado
          </span>
        )}
        <button
          onClick={onTogglePredeterminado}
          title={
            cliente.predeterminado
              ? "Cliente predeterminado en los filtros"
              : "Marcar como cliente predeterminado en los filtros"
          }
          className={`shrink-0 ${
            cliente.predeterminado
              ? "text-amber-500"
              : "text-slate-300 hover:text-amber-500 dark:text-slate-600"
          }`}
        >
          <Star size={14} fill={cliente.predeterminado ? "currentColor" : "none"} />
        </button>
        <button
          onClick={onEditCliente}
          title="Editar cliente"
          className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <Pencil size={14} />
        </button>
      </div>

      {expandido && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-2 dark:border-slate-800">
          <TareaArbolLista
            items={activos}
            tareas={tareas}
            estadoInicialId={estadoInicialId}
            mostrarFinalizadas={mostrarFinalizadas}
            onTareaCreated={onTareaCreated}
            onTareaSincronizada={onTareaSincronizada}
            onEditar={onEditar}
            vacioLabel="Sin proyectos activos"
          />

          <button
            onClick={onNuevoProyecto}
            className="mt-1 flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[var(--accent-primary)] hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <Plus size={13} /> Nuevo proyecto
          </button>

          {archivados.length > 0 && (
            <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMostrarArchivados((v) => !v)}
                className="flex items-center gap-1 px-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform ${mostrarArchivados ? "rotate-90" : ""}`}
                />
                Archivados ({archivados.length})
              </button>
              {mostrarArchivados && (
                <div className="mt-1">
                  <TareaArbolLista
                    items={archivados}
                    tareas={tareas}
                    estadoInicialId={estadoInicialId}
                    mostrarFinalizadas={mostrarFinalizadas}
                    onTareaCreated={onTareaCreated}
                    onTareaSincronizada={onTareaSincronizada}
                    onEditar={onEditar}
                    vacioLabel=""
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
