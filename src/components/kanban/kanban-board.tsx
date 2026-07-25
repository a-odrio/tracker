"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { apiPatch } from "@/lib/api-client";
import type { EstadoItem, TareaItem } from "@/lib/types";
import { hojasDe } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TaskCard } from "@/components/kanban/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { Button, Modal } from "@/components/ui";

type Columns = Record<number, TareaItem[]>;

export function KanbanBoard({
  raiz,
  estados,
  colorPrincipal,
}: {
  raiz: TareaItem;
  estados: EstadoItem[];
  colorPrincipal: string;
}) {
  const { tareas: todasLasTareas, upsertTarea, sincronizarTareas } = useAppData();
  const [columns, setColumnsState] = useState<Columns>({});
  const columnsRef = useRef<Columns>({});
  const [activeTask, setActiveTask] = useState<TareaItem | null>(null);
  const [editing, setEditing] = useState<TareaItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const ordenados = [...estados].sort((a, b) => a.orden - b.orden);

  function setColumns(updater: Columns | ((prev: Columns) => Columns)) {
    const next =
      typeof updater === "function"
        ? (updater as (prev: Columns) => Columns)(columnsRef.current)
        : updater;
    columnsRef.current = next;
    setColumnsState(next);
  }

  function recalcularColumnas(tareas: TareaItem[]) {
    const raizActual = tareas.find((t) => t.id === raiz.id) ?? raiz;
    const tarjetas = hojasDe(raizActual, tareas);
    const grouped: Columns = {};
    for (const estado of estados) grouped[estado.id] = [];
    for (const tarjeta of tarjetas) (grouped[tarjeta.estadoId] ??= []).push(tarjeta);
    for (const estadoId of Object.keys(grouped)) {
      grouped[Number(estadoId)].sort((a, b) => a.ordenEstado - b.ordenEstado);
    }
    setColumns(grouped);
  }

  useEffect(() => {
    recalcularColumnas(todasLasTareas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todasLasTareas, raiz.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function findContainer(id: number | string): number | undefined {
    if (typeof id === "string" && id.startsWith("columna-")) {
      return Number(id.replace("columna-", ""));
    }
    const cols = columnsRef.current;
    return Object.keys(cols)
      .map(Number)
      .find((estadoId) => cols[estadoId].some((t) => t.id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as number;
    const container = findContainer(id);
    if (container === undefined) return;
    setActiveTask(columnsRef.current[container].find((t) => t.id === id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id as number);
    const overContainer = findContainer(over.id as number | string);
    if (
      activeContainer === undefined ||
      overContainer === undefined ||
      activeContainer === overContainer
    ) {
      return;
    }
    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((t) => t.id === active.id);
      const overIndex = overItems.findIndex((t) => t.id === over.id);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      const moved = activeItems[activeIndex];
      if (!moved) return prev;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((t) => t.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          moved,
          ...overItems.slice(newIndex),
        ],
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const activeContainer = findContainer(active.id as number);
    const overContainer = findContainer(over.id as number | string);
    if (activeContainer === undefined || overContainer === undefined) return;

    if (activeContainer === overContainer) {
      const items = columnsRef.current[activeContainer];
      const activeIndex = items.findIndex((t) => t.id === active.id);
      const overIndex = items.findIndex((t) => t.id === over.id);
      if (activeIndex !== overIndex && overIndex >= 0) {
        setColumns((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));
      }
    }

    const finalColumns = columnsRef.current;
    const afectados = new Set([activeContainer, overContainer]);
    const cambios: { tarea: TareaItem; estadoId: number; index: number }[] = [];
    for (const estadoId of afectados) {
      const items = finalColumns[estadoId] ?? [];
      items.forEach((tarea, index) => {
        if (tarea.estadoId !== estadoId || tarea.ordenEstado !== index) {
          cambios.push({ tarea, estadoId, index });
        }
      });
    }
    if (cambios.length === 0) return;

    const actualizados = await Promise.all(
      cambios.map(({ tarea, estadoId, index }) =>
        apiPatch<TareaItem>(`/api/tareas/${tarea.id}`, { estadoId, ordenEstado: index }),
      ),
    );
    const tareasDespues = todasLasTareas.map(
      (t) => actualizados.find((a) => a.id === t.id) ?? t,
    );
    sincronizarTareas(tareasDespues, actualizados.map((a) => a.id));
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {raiz.cliente?.nombre} · {raiz.nombre}
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
        >
          {showForm ? "Cerrar" : "+ Nueva tarea"}
        </Button>
      </div>

      <Modal
        open={showForm || !!editing}
        onClose={() => {
          setEditing(null);
          setShowForm(false);
        }}
        title={editing ? "Editar tarea" : "Nueva tarea"}
      >
        <TaskForm
          key={editing?.id ?? "new"}
          tareas={todasLasTareas}
          estados={ordenados}
          colorPrincipal={colorPrincipal}
          tarea={editing ?? undefined}
          parentId={raiz.id}
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
      </Modal>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {ordenados.map((estado) => (
            <KanbanColumn
              key={estado.id}
              estado={estado}
              tareas={columns[estado.id] ?? []}
              onTaskClick={(tarea) => {
                setEditing(tarea);
                setShowForm(true);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard tarea={activeTask} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
