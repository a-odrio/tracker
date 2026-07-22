"use client";

import { useEffect, useMemo, useState } from "react";
import { addWeeks } from "date-fns";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { EstadoItem, PlanificacionItem, TareaItem } from "@/lib/types";
import { formatDate, toDateOnlyISO, weekDays, weekRange } from "@/lib/utils";
import { BacklogColumn } from "@/components/planning/backlog-column";
import { DayColumn } from "@/components/planning/day-column";
import { Button } from "@/components/ui";

export default function PlanificacionPage() {
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [planificacion, setPlanificacion] = useState<PlanificacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dias = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const { start, end } = useMemo(() => weekRange(weekAnchor), [weekAnchor]);

  const ultimoEstadoId = useMemo(() => {
    if (estados.length === 0) return undefined;
    return [...estados].sort((a, b) => b.orden - a.orden)[0].id;
  }, [estados]);

  function cargarSemana() {
    setLoading(true);
    apiGet<PlanificacionItem[]>(
      `/api/planificacion?desde=${toDateOnlyISO(start)}&hasta=${toDateOnlyISO(end)}`,
    )
      .then((data) => {
        setPlanificacion(data);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    Promise.all([
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<EstadoItem[]>("/api/estados"),
    ])
      .then(([t, e]) => {
        setTareas(t);
        setEstados(e);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data refetch on week change
    cargarSemana();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.getTime(), end.getTime()]);

  const backlogTareas = tareas.filter((t) => t.estadoId !== ultimoEstadoId);

  const diasPlanificadosPorTarea = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of planificacion) {
      map.set(p.tareaId, (map.get(p.tareaId) ?? 0) + 1);
    }
    return map;
  }, [planificacion]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith("tarea-") && overId.startsWith("dia-")) {
      const tareaId = Number(activeId.replace("tarea-", ""));
      const fecha = overId.replace("dia-", "");
      const yaAsignada = planificacion.some(
        (p) => p.tareaId === tareaId && p.fecha.slice(0, 10) === fecha,
      );
      if (yaAsignada) return;
      const nuevo = await apiPost<PlanificacionItem>("/api/planificacion", {
        tareaId,
        fecha,
      });
      setPlanificacion((prev) => [...prev, nuevo]);
      return;
    }

    if (activeId.startsWith("plan-")) {
      const planId = Number(activeId.replace("plan-", ""));
      if (overId === "backlog") {
        await apiDelete(`/api/planificacion/${planId}`);
        setPlanificacion((prev) => prev.filter((p) => p.id !== planId));
        return;
      }
      if (overId.startsWith("dia-")) {
        const fecha = overId.replace("dia-", "");
        const actualizado = await apiPatch<PlanificacionItem>(
          `/api/planificacion/${planId}`,
          { fecha },
        );
        setPlanificacion((prev) =>
          prev.map((p) => (p.id === planId ? actualizado : p)),
        );
      }
    }
  }

  async function eliminarAsignacion(item: PlanificacionItem) {
    await apiDelete(`/api/planificacion/${item.id}`);
    setPlanificacion((prev) => prev.filter((p) => p.id !== item.id));
  }

  async function actualizarHoras(item: PlanificacionItem, horas: number | null) {
    const actualizado = await apiPatch<PlanificacionItem>(
      `/api/planificacion/${item.id}`,
      { horasPlanificadas: horas },
    );
    setPlanificacion((prev) => prev.map((p) => (p.id === item.id ? actualizado : p)));
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar la planificación: {error}
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Planificación semanal
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setWeekAnchor((d) => addWeeks(d, -1))}>
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {formatDate(start)} – {formatDate(end)}
          </span>
          <Button variant="secondary" onClick={() => setWeekAnchor(new Date())}>
            Hoy
          </Button>
          <Button variant="secondary" onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}>
            Siguiente →
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
            <BacklogColumn
              tareas={backlogTareas}
              diasPlanificadosPorTarea={diasPlanificadosPorTarea}
            />
            {dias.map((dia) => (
              <DayColumn
                key={dia.toISOString()}
                fecha={dia}
                items={planificacion.filter(
                  (p) => p.fecha.slice(0, 10) === toDateOnlyISO(dia),
                )}
                onRemove={eliminarAsignacion}
                onHorasChange={actualizarHoras}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
