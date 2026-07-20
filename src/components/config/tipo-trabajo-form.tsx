"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import type { TipoTrabajoItem } from "@/lib/types";
import { Button, ErrorText, Input, Label } from "@/components/ui";

export function TipoTrabajoForm({
  onSaved,
  onCancel,
}: {
  onSaved: (tipo: TipoTrabajoItem) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setError("");
    setSaving(true);
    try {
      const tipo = await apiPost<TipoTrabajoItem>("/api/tipos-trabajo", { nombre });
      onSaved(tipo);
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
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={!nombre || saving}>
          Crear tipo de trabajo
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
