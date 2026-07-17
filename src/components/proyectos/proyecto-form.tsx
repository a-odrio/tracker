"use client";

import { useState } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type { ClienteItem, ProyectoItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { Button, ErrorText, Input, Label, Select, Textarea } from "@/components/ui";

export function ProyectoForm({
  colorPrincipal,
  clienteId,
  clientes,
  proyecto,
  onSaved,
  onCancel,
}: {
  colorPrincipal: string;
  /**
   * Without `clientes`: the fixed cliente (Proyectos page, card already picks it — no
   * selector shown). With `clientes`: just the initial value for an editable selector.
   */
  clienteId?: number;
  clientes?: ClienteItem[];
  proyecto?: ProyectoItem;
  onSaved: (proyecto: ProyectoItem) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(proyecto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion ?? "");
  const [color, setColor] = useState(proyecto?.color ?? colorPrincipal);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(
    proyecto?.clienteId ?? clienteId ?? clientes?.[0]?.id ?? 0,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const clienteIdFinal = clientes ? clienteSeleccionado : (clienteId ?? clienteSeleccionado);

  async function guardar() {
    setError("");
    setSaving(true);
    try {
      const payload = {
        clienteId: clienteIdFinal,
        nombre,
        descripcion: descripcion || null,
        color,
      };
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
      {clientes && (
        <div>
          <Label>Cliente</Label>
          <Select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(Number(e.target.value))}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
      )}
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
        <Button onClick={guardar} disabled={!nombre || saving || !clienteIdFinal}>
          {proyecto ? "Guardar cambios" : "Crear proyecto"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
