"use client";

import { useDroppable } from "@dnd-kit/core";
import type { PlanificacionItem, TareaItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AssignedChip } from "@/components/planning/assigned-chip";

export function DayColumn({
  fecha,
  items,
  tareas,
  onRemove,
  onHorasChange,
}: {
  fecha: Date;
  items: PlanificacionItem[];
  /** Lista plana completa, para resolver la raíz/cliente de cada tarea. */
  tareas: TareaItem[];
  onRemove: (item: PlanificacionItem) => void;
  onHorasChange: (item: PlanificacionItem, horas: number | null) => void;
}) {
  const iso = fecha.toISOString().slice(0, 10);
  const { setNodeRef, isOver } = useDroppable({ id: `dia-${iso}` });
  const totalHoras = items.reduce((sum, i) => sum + (i.horasPlanificadas ?? 0), 0);
  const isToday = iso === new Date().toISOString().slice(0, 10);

  return (
    <div className="flex w-40 shrink-0 flex-col">
      <div className={`mb-2 rounded-md px-2 py-1 text-center ${isToday ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : ""}`}>
        <div className="text-xs font-semibold capitalize">
          {formatDate(fecha, "EEEE")}
        </div>
        <div className="text-[10px] opacity-70">{formatDate(fecha, "dd/MM")}</div>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-40 flex-1 space-y-1.5 rounded-lg p-1.5 ${
          isOver
            ? "bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40 dark:ring-blue-700"
            : "bg-slate-100 dark:bg-slate-900/60"
        }`}
      >
        {items.map((item) => (
          <AssignedChip
            key={item.id}
            item={item}
            tareas={tareas}
            onRemove={() => onRemove(item)}
            onHorasChange={(h) => onHorasChange(item, h)}
          />
        ))}
      </div>
      {totalHoras > 0 && (
        <div className="mt-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
          {totalHoras}h planificadas
        </div>
      )}
    </div>
  );
}
