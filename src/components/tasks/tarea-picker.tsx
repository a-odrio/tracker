"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import type { EstadoItem, TareaItem } from "@/lib/types";
import { ancestros, hijosDirectos, idsDeSubarbol } from "@/lib/tarea-tree";
import { Input } from "@/components/ui";

const INDENT_PX = 16;

/**
 * Campo "Tarea" para Registro/Timer: en vez de un <select> plano + botón
 * "+ Nueva" (que no tenía forma de saber bajo qué padre crear), muestra el
 * árbol del proyecto elegido (sin las finalizadas, salvo la ya seleccionada)
 * con un buscador arriba. Click en un nodo lo selecciona —sirve tanto para
 * hojas como para elegir el proyecto u otro contenedor "en general", sin
 * agregar nada—; el "+" de cada nodo agrega una subtarea ahí mismo, sin
 * ambigüedad de en qué nivel queda.
 */
export function TareaPicker({
  proyecto,
  tareas,
  estados,
  tareaId,
  onSeleccionar,
  onTareaCreated,
  className = "w-full",
}: {
  proyecto: TareaItem;
  tareas: TareaItem[];
  estados: EstadoItem[];
  tareaId: number;
  onSeleccionar: (id: number) => void;
  onTareaCreated: (tarea: TareaItem) => void;
  /** Ancho del campo cerrado — el panel desplegado tiene su propio ancho fijo. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [haciaArriba, setHaciaArriba] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const estadoInicialId = estados.find((e) => e.esInicial)?.id ?? estados[0]?.id ?? 0;

  /** El panel puede ocupar hasta ~320px (buscador + árbol) — si no entra
   * abajo (ej. el picker del timer flotante, pegado al borde inferior), se
   * abre hacia arriba en vez de salirse de la pantalla. */
  function abrir() {
    if (btnRef.current) {
      const espacioAbajo = window.innerHeight - btnRef.current.getBoundingClientRect().bottom;
      setHaciaArriba(espacioAbajo < 320);
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cerrar();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
    }
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function cerrar() {
    setOpen(false);
    setQuery("");
  }

  function elegir(id: number) {
    onSeleccionar(id);
    cerrar();
  }

  function crear(tarea: TareaItem) {
    onTareaCreated(tarea);
    elegir(tarea.id);
  }

  const seleccionada = tareas.find((t) => t.id === tareaId) ?? proyecto;
  const idsSubarbol = new Set(idsDeSubarbol(proyecto.id, tareas));
  const q = query.trim().toLowerCase();
  const resultadosBusqueda = q
    ? tareas
        .filter(
          (t) =>
            idsSubarbol.has(t.id) &&
            (t.id === tareaId || !t.estado?.esFinal) &&
            t.nombre.toLowerCase().includes(q),
        )
        .slice(0, 20)
    : [];

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? cerrar() : abrir())}
        className={`flex items-center justify-between gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-left text-sm text-slate-900 outline-none focus:border-[var(--accent-primary)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${className}`}
      >
        <span className="truncate">{seleccionada.nombre}</span>
      </button>

      {open && (
        <div
          className={`absolute z-30 left-0 w-72 rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 ${
            haciaArriba ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="relative mb-2">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-slate-400"
            />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tarea…"
              className="pl-7"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {q ? (
              resultadosBusqueda.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-slate-400 dark:text-slate-600">
                  Sin resultados.
                </p>
              ) : (
                resultadosBusqueda.map((t) => {
                  const cadena = ancestros(t, tareas).slice(1);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => elegir(t.id)}
                      className={`flex w-full flex-col items-start gap-0.5 rounded px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        t.id === tareaId ? "bg-[var(--accent-primary)]/10" : ""
                      }`}
                    >
                      <span className="truncate text-sm text-slate-800 dark:text-slate-200">
                        {t.nombre}
                      </span>
                      <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {t.id === proyecto.id
                          ? "Proyecto en general"
                          : (cadena.map((a) => a.nombre).join(" / ") || "Subtarea directa")}
                      </span>
                    </button>
                  );
                })
              )
            ) : (
              <NodoPicker
                tarea={proyecto}
                tareas={tareas}
                profundidad={0}
                seleccionadoId={tareaId}
                estadoInicialId={estadoInicialId}
                onSeleccionar={elegir}
                onTareaCreated={crear}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NodoPicker({
  tarea,
  tareas,
  profundidad,
  seleccionadoId,
  estadoInicialId,
  onSeleccionar,
  onTareaCreated,
}: {
  tarea: TareaItem;
  tareas: TareaItem[];
  profundidad: number;
  seleccionadoId: number;
  estadoInicialId: number;
  onSeleccionar: (id: number) => void;
  onTareaCreated: (tarea: TareaItem) => void;
}) {
  const [expandido, setExpandido] = useState(profundidad === 0);
  const [agregando, setAgregando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creando, setCreando] = useState(false);

  const hijos = hijosDirectos(tarea.id, tareas)
    .filter((h) => !h.estado?.esFinal || h.id === seleccionadoId)
    .sort((a, b) => a.orden - b.orden);

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
    } finally {
      setCreando(false);
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-md py-1 pr-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
          tarea.id === seleccionadoId ? "bg-[var(--accent-primary)]/10" : ""
        }`}
        style={{ paddingLeft: profundidad * INDENT_PX }}
      >
        {hijos.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            title={expandido ? "Contraer" : "Expandir"}
            className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <ChevronRight size={12} className={`transition-transform ${expandido ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="inline-block w-3 shrink-0" />
        )}
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: tarea.color ?? tarea.estado?.color ?? "#64748b" }}
        />
        <button
          type="button"
          onClick={() => onSeleccionar(tarea.id)}
          className="min-w-0 flex-1 truncate text-left text-sm text-slate-700 dark:text-slate-300"
        >
          {tarea.nombre}
        </button>
        <button
          type="button"
          onClick={() => setAgregando((v) => !v)}
          title="Agregar subtarea"
          className="shrink-0 text-slate-400 hover:text-[var(--accent-primary)] dark:text-slate-500"
        >
          <Plus size={12} />
        </button>
      </div>

      {agregando && (
        <div
          className="flex items-center gap-1.5 py-1"
          style={{ paddingLeft: (profundidad + 1) * INDENT_PX + 12 }}
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
            className="h-7 flex-1 text-xs"
          />
          <button
            type="button"
            onClick={crearSubtarea}
            disabled={!nombreNuevo.trim() || creando}
            className="shrink-0 text-xs font-medium text-[var(--accent-primary)] hover:underline disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      )}

      {expandido &&
        hijos.map((h) => (
          <NodoPicker
            key={h.id}
            tarea={h}
            tareas={tareas}
            profundidad={profundidad + 1}
            seleccionadoId={seleccionadoId}
            estadoInicialId={estadoInicialId}
            onSeleccionar={onSeleccionar}
            onTareaCreated={onTareaCreated}
          />
        ))}
    </div>
  );
}
