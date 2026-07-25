"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type {
  ClienteItem,
  EstadoItem,
  RegistroTiempoItem,
  TareaItem,
  TipoTrabajoItem,
} from "@/lib/types";
import { raizDe } from "@/lib/tarea-tree";
import { timeToMinutes, toDateOnlyISO } from "@/lib/utils";
import {
  Button,
  ErrorText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { TaskForm } from "@/components/tasks/task-form";
import { TareaPicker } from "@/components/tasks/tarea-picker";
import { TipoTrabajoForm } from "@/components/config/tipo-trabajo-form";
import { useClienteProyectoSelector } from "@/components/timetracking/use-cliente-proyecto-selector";
import { SubVistaPanel } from "@/components/timetracking/subvista-panel";

type SubVista = "form" | "nuevo-proyecto" | "nuevo-tipo";

/** Estado a mostrar por defecto para una tarea: el actual, salvo que sea el
 * estado inicial, en cuyo caso se previsualiza el siguiente (misma regla que
 * aplica el backend al registrar trabajo por primera vez). */
function estadoPorDefecto(tarea: TareaItem | undefined, estados: EstadoItem[]): number | "" {
  if (!tarea) return "";
  if (!tarea.estado?.esInicial) return tarea.estadoId;
  const siguiente = estados
    .filter((e) => e.orden > tarea.estado!.orden)
    .sort((a, b) => a.orden - b.orden)[0];
  return siguiente?.id ?? tarea.estadoId;
}

export function TimeEntryForm({
  clientes,
  tareas,
  tipos,
  estados,
  colorPrincipal,
  registrosDelDia,
  registro,
  /** Cliente preseleccionado (ej. el filtro general de la pantalla). */
  clienteInicial,
  /** Fecha/horario/tarea preseleccionados (selección en el calendario, o
   * valores tomados del timer al iniciarlo/detenerlo). */
  valoresIniciales,
  onTareaCreated,
  onTipoCreated,
  onSaved,
  onCancel,
}: {
  clientes: ClienteItem[];
  tareas: TareaItem[];
  tipos: TipoTrabajoItem[];
  estados: EstadoItem[];
  colorPrincipal: string;
  registrosDelDia: RegistroTiempoItem[];
  registro?: RegistroTiempoItem;
  clienteInicial?: number;
  valoresIniciales?: {
    fecha?: string;
    horaInicio?: string;
    horaFin?: string;
    tareaId?: number;
  };
  onTareaCreated: (tarea: TareaItem) => void;
  onTipoCreated: (tipo: TipoTrabajoItem) => void;
  onSaved: (registro: RegistroTiempoItem) => void;
  onCancel?: () => void;
}) {
  const [subVista, setSubVista] = useState<SubVista>("form");
  const [fecha, setFecha] = useState(
    registro?.fecha.slice(0, 10) ?? valoresIniciales?.fecha ?? toDateOnlyISO(new Date()),
  );

  const tareaSeedInicial = registro
    ? tareas.find((t) => t.id === registro.tareaId)
    : valoresIniciales?.tareaId !== undefined
      ? tareas.find((t) => t.id === valoresIniciales.tareaId)
      : undefined;
  const raizInicial = tareaSeedInicial ? raizDe(tareaSeedInicial, tareas) : undefined;
  const clienteInicialCombinado = raizInicial?.clienteId ?? clienteInicial;

  // El id inicial de tarea sigue al de la tarea/registro que se esté
  // editando, o si no al de proyecto — se recalcula solo una vez, en el
  // primer render; después lo maneja `cambiarTarea` más abajo.
  const clienteIdInicial =
    clienteInicialCombinado ?? clientes.find((c) => c.predeterminado)?.id ?? clientes[0]?.id ?? "";
  const proyectoIdInicial =
    raizInicial?.id ??
    tareas.find((t) => t.parentId === null && t.clienteId === clienteIdInicial)?.id ??
    0;
  const [tareaId, setTareaId] = useState<number>(tareaSeedInicial?.id ?? proyectoIdInicial);
  const { clienteId, proyectoId, proyectosFiltrados, cambiarCliente, cambiarProyecto } =
    useClienteProyectoSelector({
      clientes,
      tareas,
      clienteInicial: clienteInicialCombinado,
      proyectoInicial: raizInicial?.id,
      onProyectoCambiado: cambiarTarea,
    });
  const [tipoTrabajoId, setTipoTrabajoId] = useState(
    registro?.tipoTrabajoId ?? tipos[0]?.id ?? 0,
  );
  const [horaInicio, setHoraInicio] = useState(
    registro?.horaInicio ?? valoresIniciales?.horaInicio ?? "09:00",
  );
  const [horaFin, setHoraFin] = useState(
    registro?.horaFin ?? valoresIniciales?.horaFin ?? "10:00",
  );
  const [comentarios, setComentarios] = useState(registro?.comentarios ?? "");
  const [tareaEstadoId, setTareaEstadoId] = useState<number | "">(() =>
    estadoPorDefecto(tareas.find((t) => t.id === tareaId), estados),
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function cambiarTarea(id: number) {
    setTareaId(id);
    setTareaEstadoId(estadoPorDefecto(tareas.find((t) => t.id === id), estados));
  }

  const solapa = useMemo(() => {
    if (!horaInicio || !horaFin) return false;
    const inicio = timeToMinutes(horaInicio);
    const fin = timeToMinutes(horaFin);
    return registrosDelDia
      .filter((r) => r.id !== registro?.id && r.fecha.slice(0, 10) === fecha)
      .some((r) => {
        const rInicio = timeToMinutes(r.horaInicio);
        const rFin = timeToMinutes(r.horaFin);
        return inicio < rFin && fin > rInicio;
      });
  }, [horaInicio, horaFin, registrosDelDia, fecha, registro?.id]);

  async function guardar() {
    setError("");
    setSaving(true);
    const payload = {
      fecha,
      tareaId: Number(tareaId),
      tipoTrabajoId: Number(tipoTrabajoId),
      horaInicio,
      horaFin,
      comentarios: comentarios || null,
      tareaEstadoId: tareaEstadoId ? Number(tareaEstadoId) : undefined,
    };
    try {
      const resultado = registro
        ? await apiPatch<RegistroTiempoItem>(
            `/api/registros-tiempo/${registro.id}`,
            payload,
          )
        : await apiPost<RegistroTiempoItem>("/api/registros-tiempo", payload);
      onSaved(resultado);
      if (!registro) {
        setComentarios("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const proyectoActual = tareas.find((t) => t.id === proyectoId);
  const estadosOrdenados = [...estados].sort((a, b) => a.orden - b.orden);

  if (subVista === "nuevo-proyecto") {
    return (
      <SubVistaPanel
        titulo="Nuevo proyecto"
        volverLabel="← Volver al registro"
        onVolver={() => setSubVista("form")}
      >
        <TaskForm
          colorPrincipal={colorPrincipal}
          clientes={clientes}
          clienteId={clienteId || undefined}
          tareas={tareas}
          estados={estados}
          parentId={null}
          onSaved={onTareaCreated}
          onDone={() => setSubVista("form")}
          onCancel={() => setSubVista("form")}
        />
      </SubVistaPanel>
    );
  }

  if (subVista === "nuevo-tipo") {
    return (
      <SubVistaPanel
        titulo="Nuevo tipo de trabajo"
        volverLabel="← Volver al registro"
        onVolver={() => setSubVista("form")}
      >
        <TipoTrabajoForm
          onSaved={(tipo) => {
            onTipoCreated(tipo);
            setTipoTrabajoId(tipo.id);
            setSubVista("form");
          }}
          onCancel={() => setSubVista("form")}
        />
      </SubVistaPanel>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label>Cliente</Label>
          <Select
            value={clienteId}
            onChange={(e) => cambiarCliente(Number(e.target.value))}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Proyecto</Label>
            <button
              type="button"
              onClick={() => setSubVista("nuevo-proyecto")}
              className="flex items-center gap-0.5 text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              <Plus size={11} /> Nuevo
            </button>
          </div>
          <Select
            value={proyectoId}
            onChange={(e) => cambiarProyecto(Number(e.target.value))}
          >
            {proyectosFiltrados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Tarea</Label>
          {proyectoActual ? (
            <TareaPicker
              proyecto={proyectoActual}
              tareas={tareas}
              estados={estados}
              tareaId={tareaId}
              onSeleccionar={cambiarTarea}
              onTareaCreated={onTareaCreated}
            />
          ) : (
            <div className="flex h-[34px] items-center rounded-md border border-slate-200 px-2.5 text-sm text-slate-400 dark:border-slate-800">
              Sin proyecto
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Tipo de trabajo</Label>
            <button
              type="button"
              onClick={() => setSubVista("nuevo-tipo")}
              className="flex items-center gap-0.5 text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              <Plus size={11} /> Nuevo
            </button>
          </div>
          <Select
            value={tipoTrabajoId}
            onChange={(e) => setTipoTrabajoId(Number(e.target.value))}
          >
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Estado de la tarea</Label>
          <Select
            value={tareaEstadoId}
            onChange={(e) => setTareaEstadoId(Number(e.target.value))}
          >
            {estadosOrdenados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Hora inicio</Label>
          <Input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>
        <div>
          <Label>Hora fin</Label>
          <Input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-4">
          <Label>Comentarios</Label>
          <Textarea
            rows={2}
            value={comentarios ?? ""}
            onChange={(e) => setComentarios(e.target.value)}
          />
        </div>
      </div>
      {solapa && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          ⚠ Este horario se superpone con otro registro del mismo día. Podés guardarlo igual.
        </p>
      )}
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={saving || !tareaId}>
          {registro ? "Guardar cambios" : "Agregar registro"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
