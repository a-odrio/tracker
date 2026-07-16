"use client";

import { useState } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type { EstadoItem, Prioridad, ProyectoItem, TareaItem } from "@/lib/types";
import { PRIORIDAD_LABEL } from "@/lib/utils";
import { Button, ErrorText, Input, Label, Select, Textarea } from "@/components/ui";

const PRIORIDADES: Prioridad[] = ["URGENTE", "ALTA", "MEDIA", "BAJA"];

export function TaskForm({
  proyectos,
  estados,
  tarea,
  defaultProyectoId,
  onSaved,
  onCancel,
}: {
  proyectos: ProyectoItem[];
  estados: EstadoItem[];
  tarea?: TareaItem;
  defaultProyectoId?: number;
  onSaved: (tarea: TareaItem) => void;
  onCancel?: () => void;
}) {
  const [nombre, setNombre] = useState(tarea?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [proyectoId, setProyectoId] = useState(
    tarea?.proyectoId ?? defaultProyectoId ?? proyectos[0]?.id ?? 0,
  );
  const [prioridad, setPrioridad] = useState<Prioridad>(tarea?.prioridad ?? "MEDIA");
  const [estadoId, setEstadoId] = useState(tarea?.estadoId ?? estados[0]?.id ?? 0);
  const [horasEstimadas, setHorasEstimadas] = useState(
    tarea?.horasEstimadas?.toString() ?? "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setError("");
    setSaving(true);
    const payload = {
      nombre,
      descripcion: descripcion || null,
      proyectoId: Number(proyectoId),
      prioridad,
      estadoId: Number(estadoId),
      horasEstimadas: horasEstimadas ? Number(horasEstimadas) : null,
    };
    try {
      const resultado = tarea
        ? await apiPatch<TareaItem>(`/api/tareas/${tarea.id}`, payload)
        : await apiPost<TareaItem>("/api/tareas", payload);
      onSaved(resultado);
      if (!tarea) {
        setNombre("");
        setDescripcion("");
        setHorasEstimadas("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Descripción</Label>
          <Textarea
            rows={2}
            value={descripcion ?? ""}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
        <div>
          <Label>Proyecto</Label>
          <Select
            value={proyectoId}
            onChange={(e) => setProyectoId(Number(e.target.value))}
          >
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.cliente?.nombre ? `${p.cliente.nombre} · ${p.nombre}` : p.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Estado</Label>
          <Select
            value={estadoId}
            onChange={(e) => setEstadoId(Number(e.target.value))}
          >
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Prioridad</Label>
          <Select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value as Prioridad)}
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDAD_LABEL[p]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Horas estimadas</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={horasEstimadas}
            onChange={(e) => setHorasEstimadas(e.target.value)}
          />
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={!nombre || !proyectoId || saving}>
          {tarea ? "Guardar cambios" : "Crear tarea"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
