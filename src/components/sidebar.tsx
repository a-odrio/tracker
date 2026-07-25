"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  ListChecks,
  Search,
  Settings,
} from "lucide-react";
import type { EstadoItem, TareaItem, TemaItem } from "@/lib/types";
import { ancestros } from "@/lib/tarea-tree";
import { useAppData } from "@/lib/app-data";
import { ThemeToggle } from "@/components/theme-toggle";
import { Modal } from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";

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

      <div className="shrink-0 border-b border-slate-100 p-2 dark:border-slate-800">
        <TareaSearch collapsed={collapsed} />
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

const MAX_RESULTADOS = 8;

/** Buscador de tareas (cualquier profundidad, cualquier estado — vista de
 * gestión, igual criterio que /proyectos). Sin pantalla propia: un cuadro
 * con dropdown de resultados que al click abre directo el modal de edición
 * de esa tarea, reusando TaskForm. */
function TareaSearch({ collapsed }: { collapsed: boolean }) {
  const { tareas, setTareas, estados, tema, loading, error } = useAppData();
  const cargado = !loading && !error;
  const [query, setQuery] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<TareaItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  const q = query.trim().toLowerCase();
  const resultados = q
    ? tareas.filter((t) => t.nombre.toLowerCase().includes(q)).slice(0, MAX_RESULTADOS)
    : [];

  function elegir(tarea: TareaItem) {
    setEditando(tarea);
    setAbierto(false);
    setQuery("");
  }

  if (collapsed) {
    return (
      <div ref={ref} className="relative flex justify-center">
        <button
          onClick={() => {
            setAbierto((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          title="Buscar tarea"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Search size={16} />
        </button>
        {abierto && (
          <div className="absolute top-full left-0 z-30 mt-1 w-64 rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <SearchInput
              inputRef={inputRef}
              query={query}
              setQuery={setQuery}
              cargado={cargado}
              error={error}
              resultados={resultados}
              tareas={tareas}
              onElegir={elegir}
            />
          </div>
        )}
        {editando && tema && (
          <SearchEditModal
            tarea={editando}
            tareas={tareas}
            estados={estados}
            tema={tema}
            onClose={() => setEditando(null)}
            onSaved={(actualizada) =>
              setTareas((prev) => prev.map((t) => (t.id === actualizada.id ? actualizada : t)))
            }
          />
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <SearchInput
        inputRef={inputRef}
        query={query}
        setQuery={(v) => {
          setQuery(v);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        cargado={cargado}
        error={error}
        resultados={abierto ? resultados : []}
        tareas={tareas}
        onElegir={elegir}
        dropdownClassName="absolute top-full left-0 z-30 mt-1 w-full"
      />
      {editando && tema && (
        <SearchEditModal
          tarea={editando}
          tareas={tareas}
          estados={estados}
          tema={tema}
          onClose={() => setEditando(null)}
          onSaved={(actualizada) =>
            setTareas((prev) => prev.map((t) => (t.id === actualizada.id ? actualizada : t)))
          }
        />
      )}
    </div>
  );
}

function SearchInput({
  inputRef,
  query,
  setQuery,
  onFocus,
  cargado,
  error,
  resultados,
  tareas,
  onElegir,
  dropdownClassName,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (v: string) => void;
  onFocus?: () => void;
  cargado: boolean;
  error?: string;
  resultados: TareaItem[];
  tareas: TareaItem[];
  onElegir: (tarea: TareaItem) => void;
  dropdownClassName?: string;
}) {
  return (
    <>
      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          placeholder={error ? "Error al cargar" : cargado ? "Buscar tarea…" : "Cargando…"}
          disabled={!cargado}
          title={error}
          className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pr-2 pl-7 text-sm text-slate-900 outline-none focus:border-[var(--accent-primary)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      {resultados.length > 0 && (
        <div
          className={`${dropdownClassName ?? "mt-1"} max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900`}
        >
          {resultados.map((t) => {
            const cadena = ancestros(t, tareas);
            return (
              <button
                key={t.id}
                onClick={() => onElegir(t)}
                className="flex w-full flex-col items-start gap-0.5 rounded px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="truncate text-sm text-slate-800 dark:text-slate-200">
                  {t.nombre}
                </span>
                {cadena.length > 0 && (
                  <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {cadena.map((a) => a.nombre).join(" / ")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function SearchEditModal({
  tarea,
  tareas,
  estados,
  tema,
  onClose,
  onSaved,
}: {
  tarea: TareaItem;
  tareas: TareaItem[];
  estados: EstadoItem[];
  tema: TemaItem;
  onClose: () => void;
  onSaved: (tarea: TareaItem) => void;
}) {
  return (
    <Modal open onClose={onClose} title="Editar tarea">
      <TaskForm
        colorPrincipal={tema.colorPrincipal}
        tareas={tareas}
        estados={estados}
        tarea={tarea}
        onSaved={onSaved}
        onDone={onClose}
        onCancel={onClose}
      />
    </Modal>
  );
}
