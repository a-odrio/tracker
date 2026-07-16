"use client";

import { useState } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type { ProyectoItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { Button, ErrorText, Input, Label, Textarea } from "@/components/ui";

export function ProyectoForm({
  colorPrincipal,
  clienteId,
  proyecto,
  onSaved,
  onCancel,
}: {
  colorPrincipal: string;
  clienteId: number;
  proyecto?: ProyectoItem;
  onSaved: (proyecto: ProyectoItem) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(proyecto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion ?? "");
  const [color, setColor] = useState(proyecto?.color ?? colorPrincipal);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setError("");
    setSaving(true);
    try {
      const payload = { clienteId, nombre, descripcion: descripcion || null, color };
      const resultado = proyecto
        ? await apiPatch<ProyectoItem>(`/api/proyectos/${proyecto.id}`, payload)
        : await apiPost<ProyectoItem>("/api/proyectos", payload);
      onSaved(resultado);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div>
        <Label>Descripción</Label>
        <Textarea
          rows={2}
          value={descripcion ?? ""}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>
      <div>
        <Label>Color</Label>
        <ColorSwatchPicker
          colorPrincipal={colorPrincipal}
          value={color}
          onChange={setColor}
        />
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={!nombre || saving}>
          {proyecto ? "Guardar cambios" : "Crear proyecto"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
