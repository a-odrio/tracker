"use client";

import { useState } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type { ClienteItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { Button, ErrorText, Input, Label, Textarea } from "@/components/ui";

export function ClienteForm({
  colorPrincipal,
  cliente,
  onSaved,
  onCancel,
}: {
  colorPrincipal: string;
  cliente?: ClienteItem;
  onSaved: (cliente: ClienteItem) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(cliente?.descripcion ?? "");
  const [color, setColor] = useState(cliente?.color ?? colorPrincipal);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setError("");
    setSaving(true);
    try {
      const payload = { nombre, descripcion: descripcion || null, color };
      const resultado = cliente
        ? await apiPatch<ClienteItem>(`/api/clientes/${cliente.id}`, payload)
        : await apiPost<ClienteItem>("/api/clientes", payload);
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
          {cliente ? "Guardar cambios" : "Crear cliente"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
