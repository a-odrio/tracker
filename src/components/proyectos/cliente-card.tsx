"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Pencil, Plus, Star } from "lucide-react";
import { apiPatch } from "@/lib/api-client";
import type { ClienteItem, ProyectoItem } from "@/lib/types";

function ProyectoRowContent({
  proyecto,
  onEdit,
  dragHandle,
}: {
  proyecto: ProyectoItem;
  onEdit: () => void;
  dragHandle?: ReactNode;
}) {
  return (
    <>
      {dragHandle}
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
        onClick={onEdit}
        title="Editar proyecto"
        className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
      >
        <Pencil size={12} />
      </button>
    </>
  );
}

function SortableProyectoRow({
  proyecto,
  onEdit,
}: {
  proyecto: ProyectoItem;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: proyecto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <ProyectoRowContent
        proyecto={proyecto}
        onEdit={onEdit}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Arrastrar para reordenar"
            className="shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
          >
            <GripVertical size={13} />
          </button>
        }
      />
    </li>
  );
}

export function ClienteCard({
  cliente,
  onEditCliente,
  onTogglePredeterminado,
  onNuevoProyecto,
  onEditProyecto,
  onReorderProyectos,
}: {
  cliente: ClienteItem;
  onEditCliente: () => void;
  onTogglePredeterminado: () => void;
  onNuevoProyecto: () => void;
  onEditProyecto: (proyecto: ProyectoItem) => void;
  onReorderProyectos: (proyectosActivos: ProyectoItem[]) => void;
}) {
  const proyectos = cliente.proyectos ?? [];
  const activos = proyectos.filter((p) => p.activo);
  const archivados = proyectos.filter((p) => !p.activo);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activos.findIndex((p) => p.id === active.id);
    const newIndex = activos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordenados = arrayMove(activos, oldIndex, newIndex);
    onReorderProyectos(reordenados);
    await Promise.all(
      reordenados.map((proyecto, index) =>
        proyecto.orden === index
          ? Promise.resolve()
          : apiPatch(`/api/proyectos/${proyecto.id}`, { orden: index }),
      ),
    );
  }

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="mb-2 space-y-0.5">
            {activos.map((proyecto) => (
              <SortableProyectoRow
                key={proyecto.id}
                proyecto={proyecto}
                onEdit={() => onEditProyecto(proyecto)}
              />
            ))}
            {activos.length === 0 && (
              <li className="px-1.5 py-1 text-xs text-slate-400 dark:text-slate-600">
                Sin proyectos activos
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <button
        onClick={onNuevoProyecto}
        className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[var(--accent-primary)] hover:bg-slate-50 dark:hover:bg-slate-800/60"
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
            <ul className="mt-1 space-y-0.5">
              {archivados.map((proyecto) => (
                <li
                  key={proyecto.id}
                  className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <ProyectoRowContent
                    proyecto={proyecto}
                    onEdit={() => onEditProyecto(proyecto)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
