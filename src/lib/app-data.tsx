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
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  ClienteItem,
  EstadoItem,
  RegistroTiempoItem,
  TareaItem,
  TemaItem,
  TimerActivoItem,
  TipoTrabajoItem,
} from "@/lib/types";
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
  /** Timer activo, compartido para que cualquier pantalla/widget que pueda
   * iniciar uno (TimerBar, accesos directos de /registro) vea el mismo
   * estado sin desfasarse entre sí. */
  timer: TimerActivoItem | null;
  timerLoading: boolean;
  iniciarTimer: (tareaId: number, tipoTrabajoId: number) => Promise<TimerActivoItem>;
  /** Detiene el timer activo y devuelve cómo estaba justo antes de pararlo
   * (para que quien llama arme el registro manual a partir de su inicio). */
  detenerTimer: () => Promise<TimerActivoItem | null>;
  descartarTimer: () => Promise<void>;
  /** Últimos registros guardados, uno por combo tarea+tipo distinto (más
   * reciente primero) — alimenta los accesos directos de /registro. Se
   * derivan de RegistroTiempo, no de un cache aparte. */
  recientes: RegistroTiempoItem[];
  refrescarRecientes: () => Promise<void>;
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
  const [timer, setTimer] = useState<TimerActivoItem | null>(null);
  const [timerLoading, setTimerLoading] = useState(true);
  const [recientes, setRecientes] = useState<RegistroTiempoItem[]>([]);

  useEffect(() => {
    apiGet<TimerActivoItem | null>("/api/timer")
      .then(setTimer)
      .finally(() => setTimerLoading(false));
  }, []);

  useEffect(() => {
    apiGet<RegistroTiempoItem[]>("/api/registros-tiempo/recientes")
      .then(setRecientes)
      .catch(() => {});
  }, []);

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
      .catch((e) => {
        setError((e as Error).message);
        setLoading(false);
      });
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

  async function refrescarRecientes() {
    const nuevos = await apiGet<RegistroTiempoItem[]>("/api/registros-tiempo/recientes");
    setRecientes(nuevos);
  }

  async function iniciarTimer(tareaId: number, tipoTrabajoId: number) {
    const nuevo = await apiPost<TimerActivoItem>("/api/timer", { tareaId, tipoTrabajoId });
    setTimer(nuevo);
    return nuevo;
  }

  async function detenerTimer() {
    const activo = timer;
    await apiDelete("/api/timer");
    setTimer(null);
    return activo;
  }

  async function descartarTimer() {
    await apiDelete("/api/timer");
    setTimer(null);
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
        timer,
        timerLoading,
        iniciarTimer,
        detenerTimer,
        descartarTimer,
        recientes,
        refrescarRecientes,
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
