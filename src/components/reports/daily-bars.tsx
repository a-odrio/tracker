"use client";

import { formatDate } from "@/lib/utils";

export function DailyBars({
  dias,
}: {
  dias: { fecha: Date; horas: number }[];
}) {
  const max = Math.max(...dias.map((d) => d.horas), 1);
  const paso = dias.length > 20 ? 3 : dias.length > 10 ? 2 : 1;

  return (
    <div className="flex h-40 gap-1.5">
      {dias.map((dia, i) => (
        <div
          key={dia.fecha.toISOString()}
          className="flex h-full flex-1 flex-col items-center gap-1"
        >
          <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
            {dia.horas > 0 && dias.length <= 20 ? dia.horas.toFixed(1) : ""}
          </span>
          <div className="relative w-full flex-1">
            <div
              title={`${formatDate(dia.fecha)}: ${dia.horas.toFixed(1)}h`}
              className="absolute inset-x-0 bottom-0 rounded-t-md bg-blue-500/80 transition-all dark:bg-blue-500/70"
              style={{ height: `${Math.max((dia.horas / max) * 100, dia.horas > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-[10px] capitalize text-slate-500 dark:text-slate-400">
            {i % paso === 0 ? formatDate(dia.fecha, "dd/MM") : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
