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
    <div>
      <div className="flex h-40 items-end gap-1.5 border-b border-slate-200 pb-1 dark:border-slate-800">
        {dias.map((dia) => (
          <div
            key={dia.fecha.toISOString()}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
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
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 pt-1">
        {dias.map((dia, i) => (
          <span
            key={dia.fecha.toISOString()}
            className="flex-1 whitespace-nowrap text-center text-[10px] capitalize text-slate-500 dark:text-slate-400"
          >
            {i % paso === 0 ? formatDate(dia.fecha, "dd/MM") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
