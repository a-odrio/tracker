export type Prioridad = "URGENTE" | "ALTA" | "MEDIA" | "BAJA";

export interface TemaItem {
  id: number;
  colorPrincipal: string;
  avisoTimerHoras: number;
  /** Día en que arranca la semana en la grilla de Registro (0=domingo..6=sábado). */
  inicioSemana: number;
  /** Hora (0-23) en la que arranca por defecto la grilla de Registro. */
  horaInicioGrilla: number;
}

export interface EstadoItem {
  id: number;
  nombre: string;
  orden: number;
  color: string;
  mostrarEnBacklog: boolean;
  esInicial: boolean;
  esFinal: boolean;
}

export interface TipoTrabajoItem {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface ClienteItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  predeterminado: boolean;
  /** Tareas raíz (parentId null) de este cliente. */
  tareas?: TareaItem[];
}

/**
 * Modelo unificado: una tarea sin parentId es lo que antes era un Proyecto
 * ("raíz", con clienteId/color propios); con parentId es una subtarea, a
 * cualquier profundidad, que resuelve cliente/color subiendo al ancestro raíz.
 */
export interface TareaItem {
  id: number;
  parentId: number | null;
  clienteId: number | null;
  color: string | null;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  prioridad: Prioridad;
  estadoId: number;
  horasEstimadas: number | null;
  imprevista: boolean;
  orden: number;
  ordenEstado: number;
  cliente?: ClienteItem | null;
  parent?: TareaItem | null;
  estado?: EstadoItem;
}

export interface RegistroTiempoItem {
  id: number;
  fecha: string;
  tareaId: number;
  tipoTrabajoId: number;
  horaInicio: string;
  horaFin: string;
  comentarios: string | null;
  tarea?: TareaItem;
  tipoTrabajo?: TipoTrabajoItem;
}

export interface TimerActivoItem {
  id: number;
  tareaId: number;
  tipoTrabajoId: number;
  inicio: string;
  comentarios: string | null;
  tarea?: TareaItem;
  tipoTrabajo?: TipoTrabajoItem;
}

export interface PlanificacionItem {
  id: number;
  tareaId: number;
  fecha: string;
  horasPlanificadas: number | null;
  tarea?: TareaItem;
}
