"use client";

import { useState } from "react";
import { apiPatch } from "@/lib/api-client";
import type { TemaItem } from "@/lib/types";
import { ErrorText, Input, Section } from "@/components/ui";

export function AvisoTimerConfig({
  avisoTimerHoras,
  onChange,
}: {
  avisoTimerHoras: number;
  onChange: (avisoTimerHoras: number) => void;
}) {
  const [valor, setValor] = useState(String(avisoTimerHoras));
  const [error, setError] = useState("");

  async function guardar() {
    const horas = Number(valor);
    if (!valor || Number.isNaN(horas) || horas <= 0) {
      setValor(String(avisoTimerHoras));
      return;
    }
    setError("");
    try {
      const tema = await apiPatch<TemaItem>("/api/tema", { avisoTimerHoras: horas });
      onChange(tema.avisoTimerHoras);
      setValor(String(tema.avisoTimerHoras));
    } catch (e) {
      setError((e as Error).message);
      setValor(String(avisoTimerHoras));
    }
  }

  return (
    <Section title="Timer">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Si un timer queda corriendo más de esta cantidad de horas seguidas, se
        muestra un aviso por si te olvidaste de detenerlo.
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0.5"
          step="0.5"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={guardar}
          className="w-24"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">horas</span>
      </div>
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}
