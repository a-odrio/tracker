"use client";

import { useEffect, useMemo, useState } from "react";
import { addWeeks } from "date-fns";
import { apiDelete, apiGet } from "@/lib/api-client";
import type {
  ProyectoItem,
  RegistroTiempoItem,
  TareaItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { formatDate, toDateOnlyISO, weekDays, weekRange } from "@/lib/utils";
import { Button, Modal, Select } from "@/components/ui";
import { TimeEntryForm } from "@/components/timetracking/time-entry-form";
import { WeekCalendar, type Agrupacion } from "@/components/timetracking/week-calendar";

export default function RegistroPage() {
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [proyectos, setProyectos] = useState<ProyectoItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [tipos, setTipos] = useState<TipoTrabajoItem[]>([]);
  const [registros, setRegistros] = useState<RegistroTiempoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agrupacion, setAgrupacion] = useState<Agrupacion>("proyecto");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RegistroTiempoItem | null>(null);

  const dias = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const { start, end } = useMemo(() => weekRange(weekAnchor), [weekAnchor]);

  useEffect(() => {
    Promise.all([
      apiGet<ProyectoItem[]>("/api/proyectos"),
      apiGet<TareaItem[]>("/api/tareas"),
      apiGet<TipoTrabajoItem[]>("/api/tipos-trabajo"),
    ])
      .then(([p, t, ti]) => {
        setProyectos(p);
        setTareas(t);
        setTipos(ti);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  function cargarSemana() {
    setLoading(true);
    apiGet<RegistroTiempoItem[]>(
      `/api/registros-tiempo?desde=${toDateOnlyISO(start)}&hasta=${toDateOnlyISO(end)}`,
    )
      .then((data) => {
        setRegistros(data);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data refetch on week change
    cargarSemana();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start.getTime(), end.getTime()]);

  async function eliminar(registro: RegistroTiempoItem) {
    if (!confirm("¿Eliminar este registro de tiempo?")) return;
    await apiDelete(`/api/registros-tiempo/${registro.id}`);
    setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
    setEditing(null);
    setShowForm(false);
  }

  const totalHoras = registros.reduce((sum, r) => {
    const [h1, m1] = r.horaInicio.split(":").map(Number);
    const [h2, m2] = r.horaFin.split(":").map(Number);
    return sum + (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  }, 0);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar el registro de tiempo: {error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Registro de Trabajo
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setWeekAnchor((d) => addWeeks(d, -1))}>
            ← Anterior
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {formatDate(start)} – {formatDate(end)}
          </span>
          <Button variant="secondary" onClick={() => setWeekAnchor(new Date())}>
            Hoy
          </Button>
          <Button variant="secondary" onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}>
            Siguiente →
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Agrupar por</span>
          <Select
            className="w-36"
            value={agrupacion}
            onChange={(e) => setAgrupacion(e.target.value as Agrupacion)}
          >
            <option value="cliente">Cliente</option>
            <option value="proyecto">Proyecto</option>
            <option value="tarea">Tarea</option>
          </Select>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Total semana: <span className="font-medium">{totalHoras}h</span>
          </span>
        </div>
        <Button
          disabled={proyectos.length === 0}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nuevo registro
        </Button>
      </div>

      {proyectos.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
          Necesitás crear al menos un cliente y un proyecto antes de cargar registros.
          Andá a Configuración.
        </p>
      )}

      <Modal
        open={(showForm || !!editing) && proyectos.length > 0}
        onClose={() => {
          setEditing(null);
          setShowForm(false);
        }}
        title={editing ? "Editar registro" : "Nuevo registro"}
        size="lg"
      >
        <TimeEntryForm
          key={editing?.id ?? "new"}
          proyectos={proyectos}
          tareas={tareas}
          tipos={tipos}
          registrosDelDia={registros}
          registro={editing ?? undefined}
          onSaved={(registro) => {
            setRegistros((prev) => {
              const exists = prev.some((r) => r.id === registro.id);
              return exists
                ? prev.map((r) => (r.id === registro.id ? registro : r))
                : [...prev, registro];
            });
            setEditing(null);
            setShowForm(false);
          }}
          onCancel={() => {
            setEditing(null);
            setShowForm(false);
          }}
        />
        {editing && (
          <button
            onClick={() => eliminar(editing)}
            className="mt-3 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Eliminar este registro
          </button>
        )}
      </Modal>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>
      ) : (
        <WeekCalendar
          dias={dias}
          registros={registros}
          agrupacion={agrupacion}
          onEdit={(registro) => {
            setEditing(registro);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
}
