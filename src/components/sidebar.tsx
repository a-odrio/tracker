"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  ListChecks,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/tareas", label: "Tareas", icon: ListChecks },
  { href: "/planificacion", label: "Planificación", icon: CalendarDays },
  { href: "/registro", label: "Registro de Trabajo", icon: Clock },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const STORAGE_KEY = "tracker:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted UI preference after mount
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <nav
      className={`flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-150 dark:border-slate-800 dark:bg-slate-900 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-slate-100 dark:border-slate-800 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Tracker
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {LINKS.map((link) => {
          const active = pathname?.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                active
                  ? "bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </div>

      <div
        className={`flex shrink-0 border-t border-slate-100 p-3 dark:border-slate-800 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <ThemeToggle collapsed={collapsed} />
      </div>
    </nav>
  );
}
