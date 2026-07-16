"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const;

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration guard
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={collapsed ? "h-8 w-8" : "h-8 w-40"} />;
  }

  if (collapsed) {
    const actual = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
    const Icon = actual.icon;
    return (
      <button
        type="button"
        onClick={() => {
          const i = OPTIONS.findIndex((o) => o.value === theme);
          setTheme(OPTIONS[(i + 1) % OPTIONS.length].value);
        }}
        title={`Tema: ${actual.label} (clic para cambiar)`}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Icon size={16} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            theme === opt.value
              ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <opt.icon size={13} />
          {opt.label}
        </button>
      ))}
    </div>
  );
}
