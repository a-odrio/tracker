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
import { apiGet } from "@/lib/api-client";
import type { ClienteItem, EstadoItem, TareaItem, TemaItem, TipoTrabajoItem } from "@/lib/types";

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
