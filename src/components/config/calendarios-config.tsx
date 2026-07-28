"use client";

import { useState } from "react";
import { apiDelete, apiPatch } from "@/lib/api-client";
import type { CalendarioExternoItem } from "@/lib/types";
import { Button, ErrorText, Modal, Section } from "@/components/ui";
import { CalendarioExternoForm } from "@/components/config/calendario-externo-form";

export function CalendariosConfig({
  calendarios,
  onChange,
}: {
  calendarios: CalendarioExternoItem[];
  onChange: (calendarios: CalendarioExternoItem[]) => void;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState("");

  async function toggleActivo(calendario: CalendarioExternoItem) {
    const actualizado = await apiPatch<CalendarioExternoItem>(
      `/api/calendarios/${calendario.id}`,
      { activo: !calendario.activo },
    );
    onChange(calendarios.map((c) => (c.id === calendario.id ? actualizado : c)));
  }

  async function eliminar(id: number) {
    setError("");
    try {
      await apiDelete(`/api/calendarios/${id}`);
      onChange(calendarios.filter((c) => c.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Section
      title="Calendarios externos"
      actions={
        <Button variant="secondary" onClick={() => setMostrarForm(true)}>
          + Agregar calendario
        </Button>
      }
    >
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Se muestran de solo lectura, superpuestos en la grilla de Registro. Podés
        conectar más de uno.
      </p>
      {calendarios.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-600">
          Sin calendarios conectados.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {calendarios.map((calendario) => (
            <li key={calendario.id} className="flex items-center gap-3 py-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: calendario.color }}
              />
              <span
                className={`flex-1 truncate text-sm ${
                  calendario.activo
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 line-through dark:text-slate-600"
                }`}
              >
                {calendario.nombre}
              </span>
              <button
                onClick={() => toggleActivo(calendario)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                {calendario.activo ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => eliminar(calendario.id)}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                title="Eliminar"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <ErrorText>{error}</ErrorText>
      <Modal
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        title="Nuevo calendario externo"
      >
        <CalendarioExternoForm
          onSaved={(calendario) => {
            onChange([...calendarios, calendario]);
            setMostrarForm(false);
          }}
          onCancel={() => setMostrarForm(false)}
        />
      </Modal>
    </Section>
  );
}
