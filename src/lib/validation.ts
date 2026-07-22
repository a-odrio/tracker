import { z } from "zod";

export const prioridadEnum = z.enum(["URGENTE", "ALTA", "MEDIA", "BAJA"]);

export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional().nullable(),
  color: z.string().min(1, "Elegí un color"),
  activo: z.boolean().optional(),
  predeterminado: z.boolean().optional(),
});

export const proyectoSchema = z.object({
  clienteId: z.number().int(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional().nullable(),
  color: z.string().min(1, "Elegí un color"),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
});

export const estadoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  orden: z.number().int().optional(),
  color: z.string().min(1, "Elegí un color"),
});

export const tipoTrabajoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const temaSchema = z.object({
  colorPrincipal: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Formato hex inválido (ej: #3b82f6)"),
});

export const tareaSchema = z.object({
  proyectoId: z.number().int(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional().nullable(),
  prioridad: prioridadEnum.optional(),
  estadoId: z.number().int(),
  horasEstimadas: z.number().nonnegative().optional().nullable(),
  imprevista: z.boolean().optional(),
  orden: z.number().int().optional(),
});

const registroTiempoBase = z.object({
  fecha: z.string().min(1, "La fecha es obligatoria"),
  proyectoId: z.number().int(),
  tareaId: z.number().int().optional().nullable(),
  tipoTrabajoId: z.number().int(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  comentarios: z.string().optional().nullable(),
});

export const registroTiempoSchema = registroTiempoBase.refine(
  (data) => data.horaFin > data.horaInicio,
  {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["horaFin"],
  },
);

// Used for PATCH: .partial() cannot be applied to a schema with .refine(),
// so partial updates skip the horaFin > horaInicio cross-field check.
export const registroTiempoUpdateSchema = registroTiempoBase.partial();

export const planificacionSchema = z.object({
  tareaId: z.number().int(),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  horasPlanificadas: z.number().nonnegative().optional().nullable(),
});
