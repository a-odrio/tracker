"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { apiGet, apiPatch } from "@/lib/api-client";
import type { ClienteItem, EstadoItem, TareaItem, TemaItem, TipoTrabajoItem } from "@/lib/types";
import { padreRecienCerrado } from "@/lib/tarea-tree";

type AppData = {
  /** Todos los clientes, incluidos archivados — usar `clientesActivos` donde
   * haga falta ocultar los archivados (selects para elegir dónde cargar
   * tiempo/tareas nuevas). */
  clientes: ClienteItem[];
  clientesActivos: ClienteItem[];
  tareas: TareaItem[];
  estados: EstadoItem[];
  /** Todos los tipos de trabajo, incluidos inactivos — ídem `clientes`. */
  tipos: TipoTrabajoItem[];
  tiposActivos: TipoTrabajoItem[];
  tema: TemaItem | null;
  loading: boolean;
  error: string;
  setClientes: Dispatch<SetStateAction<ClienteItem[]>>;
  setTareas: Dispatch<SetStateAction<TareaItem[]>>;
  setEstados: Dispatch<SetStateAction<EstadoItem[]>>;
  setTipos: Dispatch<SetStateAction<TipoTrabajoItem[]>>;
  setTema: Dispatch<SetStateAction<TemaItem | null>>;
  /** Reemplaza `tareas` por `nuevas` y, si ese cambio cerró (esFinal) el
   * último hijo abierto de alguna tarea en `idsAfectados`, dispara el aviso
   * de "se completaron todas las subtareas" (`padreParaCerrar`). */
  sincronizarTareas: (nuevas: TareaItem[], idsAfectados: number[]) => void;
  /** Atajo de `sincronizarTareas` para el caso más común: una tarea creada o
   * editada (la reemplaza si ya existe, la agrega si es nueva). */
  upsertTarea: (tarea: TareaItem) => void;
  /** Tarea cuyo último hijo abierto se acaba de cerrar — null si no hay
   * ningún aviso pendiente. Un solo estado compartido por toda la app, para
   * que el aviso se vea sin importar desde qué pantalla o widget (Kanban,
   * timer flotante, etc.) se disparó el cambio. */
  padreParaCerrar: TareaItem | null;
  dismissPadreParaCerrar: () => void;
  /** Lleva `padreParaCerrar` al estado `esFinal` fijo y limpia el aviso. */
  finalizarPadre: () => Promise<void>;
};

const AppDataContext = createContext<AppData | null>(null);

/**
 * Fetch único de clientes/tareas/estados/tipos/tema para toda la app, en vez
 * de que cada pantalla (y el Sidebar, y el timer flotante) pida lo mismo por
 * su cuenta. Además de evitar pedidos duplicados, elimina el desfasaje entre
 * componentes montados a la vez: como todos leen y escriben el mismo estado,
 * una tarea creada en /proyectos aparece al toque en la búsqueda del sidebar
 * o en el timer flotante, sin esperar un cambio de ruta.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tipos, setTipos] = useState<TipoTrabajoItem[]>([]);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [padreParaCerrar, setPadreParaCerrar] = useState<TareaItem | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<ClienteItem[]>("/api/clientes?incluirArchivados=true"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TipoTrabajoItem[]>("/api/tipos-trabajo?incluirInactivos=true"),
      apiGet<TemaItem>("/api/tema"),
    ])
      .then(([c, t, e, ti, tm]) => {
        setClientes(c);
        setTareas(t);
        setEstados(e);
        setTipos(ti);
        setTema(tm);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const clientesActivos = useMemo(() => clientes.filter((c) => c.activo), [clientes]);
  const tiposActivos = useMemo(() => tipos.filter((t) => t.activo), [tipos]);

  function sincronizarTareas(nuevas: TareaItem[], idsAfectados: number[]) {
    const antes = tareas;
    setTareas(nuevas);
    for (const id of idsAfectados) {
      const padre = padreRecienCerrado(id, antes, nuevas);
      if (padre) {
        setPadreParaCerrar(padre);
        break;
      }
    }
  }

  function upsertTarea(tarea: TareaItem) {
    const existe = tareas.some((t) => t.id === tarea.id);
    const nuevas = existe ? tareas.map((t) => (t.id === tarea.id ? tarea : t)) : [...tareas, tarea];
    sincronizarTareas(nuevas, [tarea.id]);
  }

  async function finalizarPadre() {
    if (!padreParaCerrar) return;
    const estadoFinal = estados.find((e) => e.esFinal);
    if (!estadoFinal) return;
    const actualizado = await apiPatch<TareaItem>(`/api/tareas/${padreParaCerrar.id}`, {
      estadoId: estadoFinal.id,
    });
    setTareas((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
    setPadreParaCerrar(null);
  }

  return (
    <AppDataContext.Provider
      value={{
        clientes,
        clientesActivos,
        tareas,
        estados,
        tipos,
        tiposActivos,
        tema,
        loading,
        error,
        setClientes,
        setTareas,
        setEstados,
        setTipos,
        setTema,
        sincronizarTareas,
        upsertTarea,
        padreParaCerrar,
        dismissPadreParaCerrar: () => setPadreParaCerrar(null),
        finalizarPadre,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData debe usarse dentro de <AppDataProvider>.");
  return ctx;
}
