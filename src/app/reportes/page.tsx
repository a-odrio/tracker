"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { apiGet } from "@/lib/api-client";
import type {
  ClienteItem,
  PlanificacionItem,
  RegistroTiempoItem,
  TareaItem,
} from "@/lib/types";
import { formatDate, sumarMinutosSinSolapar, toDateOnlyISO } from "@/lib/utils";
import { Button, Section, Select } from "@/components/ui";
import { BarList, type BarListItem } from "@/components/reports/bar-list";
import { StatTile } from "@/components/reports/stat-tile";
import { DailyBars } from "@/components/reports/daily-bars";

function horasSinSolapar(registros: RegistroTiempoItem[]) {
  return sumarMinutosSinSolapar(registros) / 60;
}

type Preset = "semana" | "mes" | "30dias";

export default function ReportesPage() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [desde, setDesde] = useState(toDateOnlyISO(startOfMonth(new Date())));
  const [hasta, setHasta] = useState(toDateOnlyISO(endOfMonth(new Date())));
  const [clienteFiltro, setClienteFiltro] = useState<number | "">("");

  const [clientes, setClientes] = useState<ClienteItem[]>([]);
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
      apiGet<ClienteItem[]>("/api/clientes"),
      apiGet<RegistroTiempoItem[]>(`/api/registros-tiempo?desde=${desde}&hasta=${hasta}`),
      apiGet<RegistroTiempoItem[]>("/api/registros-tiempo"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<PlanificacionItem[]>(`/api/planificacion?desde=${desde}&hasta=${hasta}`),
    ])
      .then(([c, rRango, rTodos, t, p]) => {
        setClientes(c);
        setRegistrosRango(rRango);
        setRegistrosTodos(rTodos);
        setTareas(t);
        setPlanificacion(p);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, [desde, hasta]);

  const registrosRangoFiltrados = clienteFiltro
    ? registrosRango.filter((r) => r.proyecto?.clienteId === clienteFiltro)
    : registrosRango;
  const registrosTodosFiltrados = clienteFiltro
    ? registrosTodos.filter((r) => r.proyecto?.clienteId === clienteFiltro)
    : registrosTodos;
  const tareasFiltradas = clienteFiltro
    ? tareas.filter((t) => t.proyecto?.clienteId === clienteFiltro)
    : tareas;
  const planificacionFiltrada = clienteFiltro
    ? planificacion.filter((p) => p.tarea?.proyecto?.clienteId === clienteFiltro)
    : planificacion;

  const totalHoras = horasSinSolapar(registrosRangoFiltrados);

  const registrosImprevistos = registrosRangoFiltrados.filter((r) => r.tarea?.imprevista);
  const horasImprevistas = horasSinSolapar(registrosImprevistos);

  const dias = useMemo(() => {
    const inicio = new Date(desde);
    const fin = new Date(hasta);
    const diffDias = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
    if (diffDias > 31) return [];
    return Array.from({ length: diffDias }, (_, i) => {
      const fecha = addDays(inicio, i);
      const iso = toDateOnlyISO(fecha);
      const horas = horasSinSolapar(
        registrosRangoFiltrados.filter((r) => r.fecha.slice(0, 10) === iso),
      );
      return { fecha, horas };
    });
  }, [desde, hasta, registrosRangoFiltrados]);

  const porProyecto = useMemo(() => {
    const grupos = new Map<
      string,
      { label: string; color: string; registros: RegistroTiempoItem[] }
    >();
    for (const r of registrosRangoFiltrados) {
      const key = `p-${r.proyectoId}`;
      const existente = grupos.get(key);
      if (existente) {
        existente.registros.push(r);
      } else {
        grupos.set(key, {
          label: r.proyecto?.nombre ?? "—",
          color: r.proyecto?.color ?? "#64748b",
          registros: [r],
        });
      }
    }
    const items: BarListItem[] = [...grupos.entries()].map(([id, g]) => ({
      id,
      label: g.label,
      color: g.color,
      value: horasSinSolapar(g.registros),
    }));
    return items.sort((a, b) => b.value - a.value);
  }, [registrosRangoFiltrados]);

  const porTipoTrabajo = useMemo(() => {
    const grupos = new Map<string, { label: string; registros: RegistroTiempoItem[] }>();
    for (const r of registrosRangoFiltrados) {
      const key = String(r.tipoTrabajoId);
      const existente = grupos.get(key);
      if (existente) {
        existente.registros.push(r);
      } else {
        grupos.set(key, { label: r.tipoTrabajo?.nombre ?? "—", registros: [r] });
      }
    }
    const items: BarListItem[] = [...grupos.entries()].map(([id, g]) => ({
      id,
      label: g.label,
      color: "#8b5cf6",
      value: horasSinSolapar(g.registros),
    }));
    return items.sort((a, b) => b.value - a.value);
  }, [registrosRangoFiltrados]);

  const planificadoVsReal = useMemo(() => {
    return tareasFiltradas
      .filter((t) => t.horasEstimadas != null)
      .map((t) => {
        const horasReales = horasSinSolapar(
          registrosTodosFiltrados.filter((r) => r.tareaId === t.id),
        );
        return { tarea: t, estimadas: t.horasEstimadas ?? 0, reales: horasReales };
      })
      .sort(
        (a, b) => Math.abs(b.reales - b.estimadas) - Math.abs(a.reales - a.estimadas),
      );
  }, [tareasFiltradas, registrosTodosFiltrados]);

  const cumplimiento = useMemo(() => {
    if (planificacionFiltrada.length === 0) return null;
    const realizadas = planificacionFiltrada.filter((p) =>
      registrosTodosFiltrados.some((r) => r.tareaId === p.tareaId),
    ).length;
    return {
      realizadas,
      total: planificacionFiltrada.length,
      porcentaje: Math.round((realizadas / planificacionFiltrada.length) * 100),
    };
  }, [planificacionFiltrada, registrosTodosFiltrados]);

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

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Cliente</span>
        <Select
          className="w-44"
          value={clienteFiltro}
          onChange={(e) =>
            setClienteFiltro(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">Todos</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label="Total horas del período"
              value={`${totalHoras.toFixed(1)}h`}
              hint={`${formatDate(new Date(desde))} – ${formatDate(new Date(hasta))}`}
            />
            <StatTile
              label="Registros cargados"
              value={String(registrosRangoFiltrados.length)}
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
            <StatTile
              label="Horas imprevistas"
              value={`${horasImprevistas.toFixed(1)}h`}
              hint={
                totalHoras > 0
                  ? `${Math.round((horasImprevistas / totalHoras) * 100)}% del total · ${registrosImprevistos.length} registros`
                  : "Sin registros en el período"
              }
            />
          </div>

          {dias.length > 0 && (
            <Section title="Horas por día">
              <DailyBars dias={dias} />
            </Section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Horas por proyecto">
              <BarList items={porProyecto} />
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
