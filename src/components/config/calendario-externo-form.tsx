"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import type { CalendarioExternoItem } from "@/lib/types";
import { Button, ErrorText, Input, Label } from "@/components/ui";

export function CalendarioExternoForm({
  onSaved,
  onCancel,
}: {
  onSaved: (calendario: CalendarioExternoItem) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [urlIcs, setUrlIcs] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function guardar() {
    setError("");
    setSaving(true);
    try {
      const calendario = await apiPost<CalendarioExternoItem>("/api/calendarios", {
        nombre,
        urlIcs,
        color,
      });
      onSaved(calendario);
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
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Google - trabajo"
        />
      </div>
      <div>
        <Label>URL del calendario (formato iCal / .ics)</Label>
        <Input
          value={urlIcs}
          onChange={(e) => setUrlIcs(e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/..."
        />
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-600">
          En Google Calendar: Configuración del calendario → Integrar calendario →
          &quot;Dirección secreta en formato iCal&quot;. En Outlook: Configuración →
          Calendario → Calendarios compartidos → Publicar un calendario.
        </p>
      </div>
      <div>
        <Label>Color</Label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-16 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
        />
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={!nombre || !urlIcs || saving}>
          Agregar calendario
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
