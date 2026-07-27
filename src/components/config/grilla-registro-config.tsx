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

const HORAS = Array.from({ length: 24 }, (_, i) => i);

export function GrillaRegistroConfig({
  inicioSemana,
  horaInicioGrilla,
  onChange,
}: {
  inicioSemana: number;
  horaInicioGrilla: number;
  onChange: (cambios: Partial<Pick<TemaItem, "inicioSemana" | "horaInicioGrilla">>) => void;
}) {
  async function guardarDia(dia: number) {
    const tema = await apiPatch<TemaItem>("/api/tema", { inicioSemana: dia });
    onChange({ inicioSemana: tema.inicioSemana });
  }

  async function guardarHora(hora: number) {
    const tema = await apiPatch<TemaItem>("/api/tema", { horaInicioGrilla: hora });
    onChange({ horaInicioGrilla: tema.horaInicioGrilla });
  }

  return (
    <Section title="Grilla de Registro">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            Día en que arranca la semana
          </p>
          <Select
            className="w-40"
            value={inicioSemana}
            onChange={(e) => guardarDia(Number(e.target.value))}
          >
            {DIAS.map((nombre, i) => (
              <option key={i} value={i}>
                {nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            Hora en que arranca la grilla
          </p>
          <Select
            className="w-40"
            value={horaInicioGrilla}
            onChange={(e) => guardarHora(Number(e.target.value))}
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Section>
  );
}
