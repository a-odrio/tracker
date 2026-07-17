"use client";

import Link from "next/link";
import { Pencil, Plus, Star } from "lucide-react";
import type { ClienteItem, ProyectoItem } from "@/lib/types";

export function ClienteCard({
  cliente,
  onEditCliente,
  onTogglePredeterminado,
  onNuevoProyecto,
  onEditProyecto,
}: {
  cliente: ClienteItem;
  onEditCliente: () => void;
  onTogglePredeterminado: () => void;
  onNuevoProyecto: () => void;
  onEditProyecto: (proyecto: ProyectoItem) => void;
}) {
  const proyectos = cliente.proyectos ?? [];

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${
        cliente.activo ? "" : "opacity-60"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: cliente.color }}
        />
        <h2 className="flex-1 truncate font-semibold text-slate-900 dark:text-slate-100">
          {cliente.nombre}
        </h2>
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

      <ul className="mb-2 space-y-0.5">
        {proyectos.map((proyecto) => (
          <li
            key={proyecto.id}
            className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: proyecto.color }}
            />
            <Link
              href={`/proyectos/${proyecto.id}/kanban`}
              className={`flex-1 truncate text-sm ${
                proyecto.activo
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-slate-400 line-through dark:text-slate-600"
              }`}
            >
              {proyecto.nombre}
            </Link>
            <button
              onClick={() => onEditProyecto(proyecto)}
              title="Editar proyecto"
              className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
            >
              <Pencil size={12} />
            </button>
          </li>
        ))}
        {proyectos.length === 0 && (
          <li className="px-1.5 py-1 text-xs text-slate-400 dark:text-slate-600">
            Sin proyectos
          </li>
        )}
      </ul>

      <button
        onClick={onNuevoProyecto}
        className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[var(--accent-primary)] hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <Plus size={13} /> Nuevo proyecto
      </button>
    </div>
  );
}
