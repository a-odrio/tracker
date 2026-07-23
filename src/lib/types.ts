export type Prioridad = "URGENTE" | "ALTA" | "MEDIA" | "BAJA";

export interface TemaItem {
  id: number;
  colorPrincipal: string;
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
  proyectos?: ProyectoItem[];
}

export interface ProyectoItem {
  id: number;
  clienteId: number;
  nombre: string;
  descripcion: string | null;
  color: string;
  activo: boolean;
  orden: number;
  cliente?: ClienteItem;
}

export interface TareaItem {
  id: number;
  proyectoId: number;
  nombre: string;
  descripcion: string | null;
  prioridad: Prioridad;
  estadoId: number;
  horasEstimadas: number | null;
  imprevista: boolean;
  orden: number;
  proyecto?: ProyectoItem;
  estado?: EstadoItem;
}

export interface RegistroTiempoItem {
  id: number;
  fecha: string;
  proyectoId: number;
  tareaId: number | null;
  tipoTrabajoId: number;
  horaInicio: string;
  horaFin: string;
  comentarios: string | null;
  proyecto?: ProyectoItem;
  tarea?: TareaItem | null;
  tipoTrabajo?: TipoTrabajoItem;
}

export interface TimerActivoItem {
  id: number;
  proyectoId: number;
  tareaId: number | null;
  tipoTrabajoId: number;
  inicio: string;
  comentarios: string | null;
  proyecto?: ProyectoItem;
  tarea?: TareaItem | null;
  tipoTrabajo?: TipoTrabajoItem;
}

export interface PlanificacionItem {
  id: number;
  tareaId: number;
  fecha: string;
  horasPlanificadas: number | null;
  tarea?: TareaItem;
}
