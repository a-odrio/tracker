"use client";

import { useMemo, useState } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type {
  ProyectoItem,
  RegistroTiempoItem,
  TareaItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { timeToMinutes, toDateOnlyISO } from "@/lib/utils";
import {
  Button,
  ErrorText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";

export function TimeEntryForm({
  proyectos,
  tareas,
  tipos,
  registrosDelDia,
  registro,
  onSaved,
  onCancel,
}: {
  proyectos: ProyectoItem[];
  tareas: TareaItem[];
  tipos: TipoTrabajoItem[];
  registrosDelDia: RegistroTiempoItem[];
  registro?: RegistroTiempoItem;
  onSaved: (registro: RegistroTiempoItem) => void;
  onCancel?: () => void;
}) {
  const [fecha, setFecha] = useState(
    registro?.fecha.slice(0, 10) ?? toDateOnlyISO(new Date()),
  );
  const [proyectoId, setProyectoId] = useState(
    registro?.proyectoId ?? proyectos[0]?.id ?? 0,
  );
  const [tareaId, setTareaId] = useState<number | "">(registro?.tareaId ?? "");
  const [tipoTrabajoId, setTipoTrabajoId] = useState(
    registro?.tipoTrabajoId ?? tipos[0]?.id ?? 0,
  );
  const [horaInicio, setHoraInicio] = useState(registro?.horaInicio ?? "09:00");
  const [horaFin, setHoraFin] = useState(registro?.horaFin ?? "10:00");
  const [comentarios, setComentarios] = useState(registro?.comentarios ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const solapa = useMemo(() => {
    if (!horaInicio || !horaFin) return false;
    const inicio = timeToMinutes(horaInicio);
    const fin = timeToMinutes(horaFin);
    return registrosDelDia
      .filter((r) => r.id !== registro?.id && r.fecha.slice(0, 10) === fecha)
      .some((r) => {
        const rInicio = timeToMinutes(r.horaInicio);
        const rFin = timeToMinutes(r.horaFin);
        return inicio < rFin && fin > rInicio;
      });
  }, [horaInicio, horaFin, registrosDelDia, fecha, registro?.id]);

  async function guardar() {
    setError("");
    setSaving(true);
    const payload = {
      fecha,
      proyectoId: Number(proyectoId),
      tareaId: tareaId ? Number(tareaId) : null,
      tipoTrabajoId: Number(tipoTrabajoId),
      horaInicio,
      horaFin,
      comentarios: comentarios || null,
    };
    try {
      const resultado = registro
        ? await apiPatch<RegistroTiempoItem>(
            `/api/registros-tiempo/${registro.id}`,
            payload,
          )
        : await apiPost<RegistroTiempoItem>("/api/registros-tiempo", payload);
      onSaved(resultado);
      if (!registro) {
        setComentarios("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const tareasDisponibles = tareas.filter((t) => t.proyectoId === proyectoId);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label>Proyecto</Label>
          <Select
            value={proyectoId}
            onChange={(e) => {
              setProyectoId(Number(e.target.value));
              setTareaId("");
            }}
          >
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.cliente?.nombre ? `${p.cliente.nombre} · ${p.nombre}` : p.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Tarea (opcional)</Label>
          <Select
            value={tareaId}
            onChange={(e) => setTareaId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Sin tarea específica</option>
            {tareasDisponibles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Tipo de trabajo</Label>
          <Select
            value={tipoTrabajoId}
            onChange={(e) => setTipoTrabajoId(Number(e.target.value))}
          >
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Hora inicio</Label>
          <Input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
        <div>
          <Label>Hora fin</Label>
          <Input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <Label>Comentarios</Label>
          <Textarea
            rows={2}
            value={comentarios ?? ""}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </div>
      </div>
      {solapa && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          ⚠ Este horario se superpone con otro registro del mismo día. Podés guardarlo igual.
        </p>
      )}
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={saving || !proyectoId}>
          {registro ? "Guardar cambios" : "Agregar registro"}
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
