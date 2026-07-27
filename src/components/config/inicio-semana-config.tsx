"use client";

import { apiPatch } from "@/lib/api-client";
import type { TemaItem } from "@/lib/types";
import { Section, Select } from "@/components/ui";

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function InicioSemanaConfig({
  inicioSemana,
  onChange,
}: {
  inicioSemana: number;
  onChange: (inicioSemana: number) => void;
}) {
  async function guardar(dia: number) {
    const tema = await apiPatch<TemaItem>("/api/tema", { inicioSemana: dia });
    onChange(tema.inicioSemana);
  }

  return (
    <Section title="Semana">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Día en que arranca la semana en la grilla de Registro.
      </p>
      <Select
        className="w-40"
        value={inicioSemana}
        onChange={(e) => guardar(Number(e.target.value))}
      >
        {DIAS.map((nombre, i) => (
          <option key={i} value={i}>
            {nombre}
          </option>
        ))}
      </Select>
    </Section>
  );
}
