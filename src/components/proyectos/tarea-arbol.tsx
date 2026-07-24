"use client";

import { useState } from "react";
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
import { ChevronRight, GripVertical, Kanban, Pencil, Plus } from "lucide-react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type { TareaItem } from "@/lib/types";
import { hijosDirectos } from "@/lib/tarea-tree";
import { Input } from "@/components/ui";

const INDENT_PX = 20;

/**
 * Lista ordenable de `items` (ya filtrados/ordenados por el que llama) — un
 * nivel del árbol, sea la raíz (proyectos de un cliente) o las subtareas de
 * un nodo. El drag acá solo reordena hermanos (nunca reparenta) y solo
 * escribe `orden`, nunca `ordenEstado`: no afecta el orden por estado que ya
 * usan Kanban y la tabla de Tareas.
 */
export function TareaArbolLista({
  items,
  tareas,
  estadoInicialId,
  mostrarFinalizadas,
  onTareaCreated,
  onTareaSincronizada,
  onEditar,
  profundidad = 0,
  vacioLabel = "Sin subtareas.",
}: {
  items: TareaItem[];
  tareas: TareaItem[];
  estadoInicialId: number;
  mostrarFinalizadas: boolean;
  onTareaCreated: (tarea: TareaItem) => void;
  onTareaSincronizada: (tarea: TareaItem) => void;
  onEditar: (tarea: TareaItem) => void;
  profundidad?: number;
  vacioLabel?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // `items` son TODOS los hermanos de este nivel (define el orden real a
  // persistir); `visibles` es el subconjunto que se muestra y se puede
  // arrastrar según el filtro de finalizadas. Al reordenar, el subconjunto
  // reordenado se reinserta en sus mismas posiciones dentro de la lista
  // completa, para no alterar el orden de las que el filtro deja ocultas.
  const visibles = mostrarFinalizadas ? items : items.filter((t) => !t.estado?.esFinal);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibles.findIndex((h) => h.id === active.id);
    const newIndex = visibles.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const visiblesReordenados = arrayMove(visibles, oldIndex, newIndex);
    const idsReordenados = new Set(visiblesReordenados.map((t) => t.id));
    const cola = [...visiblesReordenados];
    const nuevosItems = items.map((t) => (idsReordenados.has(t.id) ? cola.shift()! : t));
    await Promise.all(
      nuevosItems.map(async (item, index) => {
        if (item.orden === index) return;
        const actualizado = await apiPatch<TareaItem>(`/api/tareas/${item.id}`, { orden: index });
        onTareaSincronizada(actualizado);
      }),
    );
  }

  if (visibles.length === 0) {
    return vacioLabel ? (
      <p
        className="py-1 text-xs text-slate-400 dark:text-slate-600"
        style={{ paddingLeft: (profundidad + 1) * INDENT_PX + 16 }}
      >
        {vacioLabel}
      </p>
    ) : null;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={visibles.map((h) => h.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-0.5">
          {visibles.map((item) => (
            <TareaArbolNodo
              key={item.id}
              tarea={item}
              tareas={tareas}
              estadoInicialId={estadoInicialId}
              mostrarFinalizadas={mostrarFinalizadas}
              onTareaCreated={onTareaCreated}
              onTareaSincronizada={onTareaSincronizada}
              onEditar={onEditar}
              profundidad={profundidad}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

/** Hijos directos de `parentId`, ordenados — atajo de TareaArbolLista para
 * el caso recursivo (subtareas de un nodo). */
export function TareaArbolNivel({
  parentId,
  tareas,
  ...resto
}: {
  parentId: number;
  tareas: TareaItem[];
  estadoInicialId: number;
  mostrarFinalizadas: boolean;
  onTareaCreated: (tarea: TareaItem) => void;
  onTareaSincronizada: (tarea: TareaItem) => void;
  onEditar: (tarea: TareaItem) => void;
  profundidad?: number;
}) {
  const hijos = [...hijosDirectos(parentId, tareas)].sort((a, b) => a.orden - b.orden);
  return <TareaArbolLista items={hijos} tareas={tareas} {...resto} />;
}

function TareaArbolNodo({
  tarea,
  tareas,
  estadoInicialId,
  mostrarFinalizadas,
  onTareaCreated,
  onTareaSincronizada,
  onEditar,
  profundidad,
}: {
  tarea: TareaItem;
  tareas: TareaItem[];
  estadoInicialId: number;
  mostrarFinalizadas: boolean;
  onTareaCreated: (tarea: TareaItem) => void;
  onTareaSincronizada: (tarea: TareaItem) => void;
  onEditar: (tarea: TareaItem) => void;
  profundidad: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarea.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [expandido, setExpandido] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);
  const hijosDirectosDeTarea = hijosDirectos(tarea.id, tareas);
  const tieneHijos = (
    mostrarFinalizadas
      ? hijosDirectosDeTarea
      : hijosDirectosDeTarea.filter((h) => !h.estado?.esFinal)
  ).length > 0;
  // El Kanban de una hoja solo mostraría una tarjeta (ella misma), sin
  // sentido. Para la raíz se deja siempre disponible (aunque esté vacía,
  // para poder empezar a cargarle tareas); para un nodo anidado, solo si
  // tiene hijos (ver su propio sub-árbol como tablero).
  const mostrarKanban = tarea.parentId === null || tieneHijos;

  async function crearSubtarea() {
    if (!nombreNuevo.trim()) return;
    setCreando(true);
    try {
      const nueva = await apiPost<TareaItem>("/api/tareas", {
        parentId: tarea.id,
        nombre: nombreNuevo.trim(),
        estadoId: estadoInicialId,
      });
      onTareaCreated(nueva);
      setNombreNuevo("");
      setAgregando(false);
      setExpandido(true);
    } finally {
      setCreando(false);
    }
  }

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className="group flex items-center gap-1.5 rounded-md py-1.5 pr-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        style={{ paddingLeft: profundidad * INDENT_PX }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
          className="shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
        >
          <GripVertical size={13} />
        </button>
        {tieneHijos ? (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            title={expandido ? "Contraer" : "Expandir"}
            className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ChevronRight size={13} className={`transition-transform ${expandido ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="inline-block w-[13px] shrink-0" />
        )}
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: tarea.color ?? tarea.estado?.color ?? "#64748b" }}
        />
        <span
          className={`flex-1 truncate text-sm ${
            tarea.activo
              ? "text-slate-700 dark:text-slate-300"
              : "text-slate-400 line-through dark:text-slate-600"
          }`}
        >
          {tarea.nombre}
        </span>
        <button
          onClick={() => {
            setAgregando((v) => !v);
            setExpandido(true);
          }}
          title="Agregar subtarea"
          className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-[var(--accent-primary)] dark:text-slate-600"
        >
          <Plus size={13} />
        </button>
        {mostrarKanban && (
          <Link
            href={`/proyectos/${tarea.id}/kanban`}
            title="Ver Kanban"
            className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
          >
            <Kanban size={13} />
          </Link>
        )}
        <button
          onClick={() => onEditar(tarea)}
          title="Editar"
          className="shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-200"
        >
          <Pencil size={12} />
        </button>
      </div>
      {expandido && (
        <div className="mt-0.5">
          {agregando && (
            <div
              className="flex items-center gap-1.5 py-1"
              style={{ paddingLeft: (profundidad + 1) * INDENT_PX + 16 }}
            >
              <Input
                autoFocus
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") crearSubtarea();
                  if (e.key === "Escape") setAgregando(false);
                }}
                placeholder="Nombre de la subtarea"
                className="h-7 w-56 text-xs"
              />
              <button
                onClick={crearSubtarea}
                disabled={!nombreNuevo.trim() || creando}
                className="text-xs font-medium text-[var(--accent-primary)] hover:underline disabled:opacity-40"
              >
                Agregar
              </button>
              <button
                onClick={() => setAgregando(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Cancelar
              </button>
            </div>
          )}
          <TareaArbolNivel
            parentId={tarea.id}
            tareas={tareas}
            estadoInicialId={estadoInicialId}
            mostrarFinalizadas={mostrarFinalizadas}
            onTareaCreated={onTareaCreated}
            onTareaSincronizada={onTareaSincronizada}
            onEditar={onEditar}
            profundidad={profundidad + 1}
          />
        </div>
      )}
    </li>
  );
}
