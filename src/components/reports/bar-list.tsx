"use client";

export interface BarListItem {
  id: string | number;
  label: string;
  sublabel?: string;
  value: number;
  color: string;
}

export function BarList({
  items,
  unidad = "h",
}: {
  items: BarListItem[];
  unidad?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Sin datos en este período.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.id} title={`${item.value}${unidad}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">
              {item.label}
              {item.sublabel && (
                <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
                  {item.sublabel}
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
              {item.value.toFixed(1)}
              {unidad}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, 2)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
