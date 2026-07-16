"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { apiGet } from "@/lib/api-client";
import type { PlanificacionItem, RegistroTiempoItem, TareaItem } from "@/lib/types";
import { formatDate, timeToMinutes, toDateOnlyISO } from "@/lib/utils";
import { Button, Section, Select } from "@/components/ui";
import { BarList, type BarListItem } from "@/components/reports/bar-list";
import { StatTile } from "@/components/reports/stat-tile";
import { DailyBars } from "@/components/reports/daily-bars";

function duracionHoras(r: RegistroTiempoItem) {
  return (timeToMinutes(r.horaFin) - timeToMinutes(r.horaInicio)) / 60;
}

type Preset = "semana" | "mes" | "30dias";

export default function ReportesPage() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [desde, setDesde] = useState(toDateOnlyISO(startOfMonth(new Date())));
  const [hasta, setHasta] = useState(toDateOnlyISO(endOfMonth(new Date())));
  const [agruparClienteProyecto, setAgruparClienteProyecto] = useState<
    "cliente" | "proyecto"
  >("proyecto");

  const [registrosRango, setRegistrosRango] = useState<RegistroTiempoItem[]>([]);
  const [registrosTodos, setRegistrosTodos] = useState<RegistroTiempoItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [planificacion, setPlanificacion] = useState<PlanificacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function aplicarPreset(p: Preset) {
    setPreset(p);
    const hoy = new Date();
    if (p === "semana") {
      setDesde(toDateOnlyISO(startOfWeek(hoy, { weekStartsOn: 1 })));
      setHasta(toDateOnlyISO(endOfWeek(hoy, { weekStartsOn: 1 })));
    } else if (p === "mes") {
      setDesde(toDateOnlyISO(startOfMonth(hoy)));
      setHasta(toDateOnlyISO(endOfMonth(hoy)));
    } else {
      setDesde(toDateOnlyISO(addDays(hoy, -29)));
      setHasta(toDateOnlyISO(hoy));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data refetch on range change
    setLoading(true);
    Promise.all([
      apiGet<RegistroTiempoItem[]>(`/api/registros-tiempo?desde=${desde}&hasta=${hasta}`),
      apiGet<RegistroTiempoItem[]>("/api/registros-tiempo"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<PlanificacionItem[]>(`/api/planificacion?desde=${desde}&hasta=${hasta}`),
    ])
      .then(([rRango, rTodos, t, p]) => {
        setRegistrosRango(rRango);
        setRegistrosTodos(rTodos);
        setTareas(t);
        setPlanificacion(p);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, [desde, hasta]);

  const totalHoras = registrosRango.reduce((s, r) => s + duracionHoras(r), 0);

  const dias = useMemo(() => {
    const inicio = new Date(desde);
    const fin = new Date(hasta);
    const diffDias = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
    if (diffDias > 31) return [];
    return Array.from({ length: diffDias }, (_, i) => {
      const fecha = addDays(inicio, i);
      const iso = toDateOnlyISO(fecha);
      const horas = registrosRango
        .filter((r) => r.fecha.slice(0, 10) === iso)
        .reduce((s, r) => s + duracionHoras(r), 0);
      return { fecha, horas };
    });
  }, [desde, hasta, registrosRango]);

  const porClienteProyecto = useMemo(() => {
    const mapa = new Map<string, BarListItem>();
    for (const r of registrosRango) {
      const key =
        agruparClienteProyecto === "cliente"
          ? `c-${r.proyecto?.clienteId}`
          : `p-${r.proyectoId}`;
      const label =
        agruparClienteProyecto === "cliente"
          ? (r.proyecto?.cliente?.nombre ?? "—")
          : (r.proyecto?.nombre ?? "—");
      const color =
        agruparClienteProyecto === "cliente"
          ? (r.proyecto?.cliente?.color ?? "#64748b")
          : (r.proyecto?.color ?? "#64748b");
      const existente = mapa.get(key);
      const horas = duracionHoras(r);
      if (existente) {
        existente.value += horas;
      } else {
        mapa.set(key, { id: key, label, color, value: horas });
      }
    }
    return [...mapa.values()].sort((a, b) => b.value - a.value);
  }, [registrosRango, agruparClienteProyecto]);

  const porTipoTrabajo = useMemo(() => {
    const mapa = new Map<string, BarListItem>();
    for (const r of registrosRango) {
      const key = String(r.tipoTrabajoId);
      const existente = mapa.get(key);
      const horas = duracionHoras(r);
      if (existente) {
        existente.value += horas;
      } else {
        mapa.set(key, {
          id: key,
          label: r.tipoTrabajo?.nombre ?? "—",
          color: "#8b5cf6",
          value: horas,
        });
      }
    }
    return [...mapa.values()].sort((a, b) => b.value - a.value);
  }, [registrosRango]);

  const planificadoVsReal = useMemo(() => {
    return tareas
      .filter((t) => t.horasEstimadas != null)
      .map((t) => {
        const horasReales = registrosTodos
          .filter((r) => r.tareaId === t.id)
          .reduce((s, r) => s + duracionHoras(r), 0);
        return { tarea: t, estimadas: t.horasEstimadas ?? 0, reales: horasReales };
      })
      .sort(
        (a, b) => Math.abs(b.reales - b.estimadas) - Math.abs(a.reales - a.estimadas),
      );
  }, [tareas, registrosTodos]);

  const cumplimiento = useMemo(() => {
    if (planificacion.length === 0) return null;
    const realizadas = planificacion.filter((p) =>
      registrosTodos.some((r) => r.tareaId === p.tareaId),
    ).length;
    return {
      realizadas,
      total: planificacion.length,
      porcentaje: Math.round((realizadas / planificacion.length) * 100),
    };
  }, [planificacion, registrosTodos]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar los reportes: {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Reportes
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant={preset === "semana" ? "primary" : "secondary"}
            onClick={() => aplicarPreset("semana")}
          >
            Esta semana
          </Button>
          <Button
            variant={preset === "mes" ? "primary" : "secondary"}
            onClick={() => aplicarPreset("mes")}
          >
            Este mes
          </Button>
          <Button
            variant={preset === "30dias" ? "primary" : "secondary"}
            onClick={() => aplicarPreset("30dias")}
          >
            Últimos 30 días
          </Button>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile
              label="Total horas del período"
              value={`${totalHoras.toFixed(1)}h`}
              hint={`${formatDate(new Date(desde))} – ${formatDate(new Date(hasta))}`}
            />
            <StatTile
              label="Registros cargados"
              value={String(registrosRango.length)}
            />
            <StatTile
              label="Cumplimiento de planificación"
              value={cumplimiento ? `${cumplimiento.porcentaje}%` : "—"}
              hint={
                cumplimiento
                  ? `${cumplimiento.realizadas} de ${cumplimiento.total} tareas planificadas con trabajo registrado`
                  : "Sin tareas planificadas en el período"
              }
            />
            <StatTile
              label="Promedio diario"
              value={`${dias.length ? (totalHoras / Math.max(dias.filter((d) => d.horas > 0).length, 1)).toFixed(1) : "—"}h`}
              hint="sobre días con carga"
            />
          </div>

          {dias.length > 0 && (
            <Section title="Horas por día">
              <DailyBars dias={dias} />
            </Section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Section
              title="Horas por cliente / proyecto"
              actions={
                <Select
                  className="w-32"
                  value={agruparClienteProyecto}
                  onChange={(e) =>
                    setAgruparClienteProyecto(e.target.value as "cliente" | "proyecto")
                  }
                >
                  <option value="cliente">Cliente</option>
                  <option value="proyecto">Proyecto</option>
                </Select>
              }
            >
              <BarList items={porClienteProyecto} />
            </Section>

            <Section title="Horas por tipo de trabajo">
              <BarList items={porTipoTrabajo} />
            </Section>
          </div>

          <Section title="Planificado vs. real por tarea">
            {planificadoVsReal.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ninguna tarea tiene horas estimadas cargadas todavía.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2 pr-3">Tarea</th>
                      <th className="py-2 pr-3">Estimadas</th>
                      <th className="py-2 pr-3">Reales (total)</th>
                      <th className="py-2 pr-3">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {planificadoVsReal.map(({ tarea, estimadas, reales }) => {
                      const diff = reales - estimadas;
                      return (
                        <tr key={tarea.id}>
                          <td className="py-2 pr-3 text-slate-800 dark:text-slate-200">
                            {tarea.nombre}
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                              {tarea.proyecto?.cliente?.nombre} · {tarea.proyecto?.nombre}
                            </div>
                          </td>
                          <td className="py-2 pr-3 tabular-nums text-slate-600 dark:text-slate-300">
                            {estimadas.toFixed(1)}h
                          </td>
                          <td className="py-2 pr-3 tabular-nums text-slate-600 dark:text-slate-300">
                            {reales.toFixed(1)}h
                          </td>
                          <td
                            className={`py-2 pr-3 tabular-nums font-medium ${
                              diff > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(1)}h
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
