"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { apiPatch, apiPost } from "@/lib/api-client";
import type { ClienteItem, EstadoItem, Frecuencia, Prioridad, TareaItem } from "@/lib/types";
import { ancestros, hijosDirectos } from "@/lib/tarea-tree";
import { nombreConPeriodo } from "@/lib/recurrencia";
import { useAppData } from "@/lib/app-data";
import { PRIORIDAD_LABEL } from "@/lib/utils";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { SortableRow } from "@/components/config/sortable-row";
import { Button, ErrorText, Input, Label, Select, Textarea } from "@/components/ui";

const PRIORIDADES: Prioridad[] = ["URGENTE", "ALTA", "MEDIA", "BAJA"];
const FRECUENCIA_LABEL: Record<Frecuencia, string> = { SEMANAL: "Semanal", MENSUAL: "Mensual" };

type Sujeto = { tarea?: TareaItem; parentId?: number | null };

function identidadDe(sujeto: Sujeto): string {
  return sujeto.tarea ? `t${sujeto.tarea.id}` : `nuevo-bajo-${sujeto.parentId ?? "cascada"}`;
}

/**
 * Una tarea sin padre (parentId null) es una tarea raíz — antes "Proyecto":
 * lleva cliente/color propios y no tiene Prioridad/horas estimadas propias.
 * Con padre es una subtarea a cualquier profundidad. Este form maneja los
 * dos casos, más una sección "Subtareas" (solo al editar una tarea existente)
 * que permite entrar de a un nivel por vez sin límite de profundidad.
 */
export function TaskForm({
  clientes,
  clienteId,
  tareas,
  estados,
  colorPrincipal,
  tarea,
  parentId,
  onSaved,
  onDone,
  onCancel,
}: {
  /** Si se pasa, muestra un selector de Cliente (tanto para tareas raíz como
   * para elegir bajo qué raíz anidar una subtarea nueva sin padre fijo). */
  clientes?: ClienteItem[];
  /** Cliente fijo para una tarea raíz nueva cuando no se muestra el selector. */
  clienteId?: number;
  tareas: TareaItem[];
  estados: EstadoItem[];
  colorPrincipal: string;
  tarea?: TareaItem;
  /** null = crear una tarea raíz. Un id = crear/editar como subtarea de esa
   * tarea. undefined (solo al crear, sin `tarea`) = dejar elegir bajo qué
   * raíz anidarla, mostrando un selector Cliente → tarea raíz. */
  parentId?: number | null;
  /** Se llama para CUALQUIER tarea guardada (la principal, una subtarea al
   * crearla/editarla, o un reordenamiento) — para que el que llama mantenga
   * su lista sincronizada. Nunca implica que haya que cerrar nada. */
  onSaved: (tarea: TareaItem) => void;
  /** Se llama solo cuando se guardó la tarea principal (con la que se abrió
   * este form), no una subtarea anidada — señal de "listo, ya podés cerrar". */
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const raiz: Sujeto = { tarea, parentId };
  const [pila, setPila] = useState<Sujeto[]>([]);
  const actual = pila[pila.length - 1] ?? raiz;

  return (
    <div className="space-y-3">
      {pila.length > 0 && (
        <button
          onClick={() => setPila((p) => p.slice(0, -1))}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Volver
        </button>
      )}
      <TaskFormInner
        key={identidadDe(actual)}
        clientes={clientes}
        clienteId={clienteId}
        tareas={tareas}
        estados={estados}
        colorPrincipal={colorPrincipal}
        tarea={actual.tarea}
        parentId={actual.parentId}
        onDrillIn={(sujeto) => setPila((p) => [...p, sujeto])}
        onGuardado={(t) => {
          onSaved(t);
          if (pila.length > 0) {
            setPila((p) => p.slice(0, -1));
          } else {
            onDone?.();
          }
        }}
        onSincronizar={onSaved}
        onCancel={pila.length === 0 ? onCancel : undefined}
      />
    </div>
  );
}

function TaskFormInner({
  clientes,
  clienteId,
  tareas,
  estados,
  colorPrincipal,
  tarea,
  parentId,
  onDrillIn,
  onGuardado,
  onSincronizar,
  onCancel,
}: {
  clientes?: ClienteItem[];
  clienteId?: number;
  tareas: TareaItem[];
  estados: EstadoItem[];
  colorPrincipal: string;
  tarea?: TareaItem;
  parentId?: number | null;
  onDrillIn: (sujeto: Sujeto) => void;
  /** La tarea que representa esta pantalla se guardó (crear o editar). */
  onGuardado: (tarea: TareaItem) => void;
  /** Otra tarea se actualizó como efecto secundario (reordenar subtareas):
   * hay que sincronizar el estado del que llama, pero sin navegar. */
  onSincronizar: (tarea: TareaItem) => void;
  onCancel?: () => void;
}) {
  const esRaiz = tarea ? tarea.parentId == null : parentId === null;
  // Un id concreto cuando se edita una subtarea existente, o cuando el que
  // llama ya fijó bajo qué padre crearla. undefined al crear con parentId
  // undefined: ahí se muestra el selector Cliente → tarea raíz.
  const parentIdFijo = tarea ? tarea.parentId : parentId === undefined ? undefined : parentId;
  const mostrarCascadaPadre = !esRaiz && !tarea && parentIdFijo === undefined;

  const [nombre, setNombre] = useState(
    tarea?.recurrente ? (tarea.nombreBase ?? tarea.nombre) : (tarea?.nombre ?? ""),
  );
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [recurrente, setRecurrente] = useState(tarea?.recurrente ?? false);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(
    tarea?.recurrenciaFrecuencia ?? "SEMANAL",
  );
  const [intervalo, setIntervalo] = useState(
    tarea?.recurrenciaIntervalo?.toString() ?? "1",
  );
  // El período del nombre queda anclado a recurrenciaFecha de la instancia
  // que ya era recurrente (no a "hoy"): si no, guardar cualquier otro
  // cambio en una instancia recurrente vieja le cambiaría el período
  // silenciosamente. Una tarea nueva, o una que recién se vuelve
  // recurrente, ancla a hoy.
  const fechaPeriodo =
    tarea?.recurrente ? new Date(tarea.recurrenciaFecha ?? tarea.createdAt) : new Date();
  const { tiposActivos } = useAppData();
  const [tipoTrabajoId, setTipoTrabajoId] = useState<number | "">(tarea?.tipoTrabajoId ?? "");
  const estadosOrdenados = [...estados].sort((a, b) => a.orden - b.orden);
  const [estadoId, setEstadoId] = useState(
    tarea?.estadoId ?? estados.find((e) => e.esInicial)?.id ?? estados[0]?.id ?? 0,
  );

  // --- Modo raíz (antes "Proyecto"): cliente + color propios.
  const [clienteIdRaiz, setClienteIdRaiz] = useState(
    tarea?.clienteId ??
      clienteId ??
      clientes?.find((c) => c.predeterminado)?.id ??
      clientes?.[0]?.id ??
      0,
  );
  const clienteIdRaizFinal = clientes ? clienteIdRaiz : (clienteId ?? clienteIdRaiz);
  const [color, setColor] = useState(tarea?.color ?? colorPrincipal);

  // --- Modo subtarea: prioridad/horas/imprevista, más el selector de padre
  // cuando no viene fijado desde afuera.
  const [prioridad, setPrioridad] = useState<Prioridad>(tarea?.prioridad ?? "MEDIA");
  const [horasEstimadas, setHorasEstimadas] = useState(
    tarea?.horasEstimadas?.toString() ?? "",
  );
  const [imprevista, setImprevista] = useState(tarea?.imprevista ?? false);

  const raicesTodas = tareas.filter((t) => t.parentId === null);
  const [clienteCascada, setClienteCascada] = useState<number | "">(
    clientes?.find((c) => c.predeterminado)?.id ?? clientes?.[0]?.id ?? "",
  );
  const raicesFiltradas = clientes
    ? raicesTodas.filter((r) => !clienteCascada || r.clienteId === clienteCascada)
    : raicesTodas;
  const [parentIdCascada, setParentIdCascada] = useState<number | "">(
    raicesFiltradas[0]?.id ?? "",
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const padreDirecto = !esRaiz
    ? tareas.find((t) => t.id === (parentIdFijo ?? undefined))
    : undefined;
  const breadcrumb = padreDirecto ? [...ancestros(padreDirecto, tareas), padreDirecto] : [];

  function cambiarClienteCascada(id: number) {
    setClienteCascada(id);
    const disponibles = raicesTodas.filter((r) => r.clienteId === id);
    setParentIdCascada(disponibles[0]?.id ?? "");
  }

  const puedeGuardar = esRaiz
    ? !!nombre && !!clienteIdRaizFinal
    : !!nombre && (!!parentIdFijo || !!parentIdCascada);

  async function guardar() {
    setError("");
    setSaving(true);
    try {
      const nombreFinal = recurrente ? nombreConPeriodo(nombre, frecuencia, fechaPeriodo) : nombre;
      const camposRecurrencia = {
        nombre: nombreFinal,
        nombreBase: recurrente ? nombre : null,
        recurrente,
        recurrenciaFrecuencia: recurrente ? frecuencia : null,
        recurrenciaIntervalo: recurrente ? Number(intervalo) || 1 : null,
        recurrenciaFecha: recurrente ? fechaPeriodo.toISOString() : null,
        tipoTrabajoId: tipoTrabajoId ? Number(tipoTrabajoId) : null,
      };
      const payload: Record<string, unknown> = esRaiz
        ? {
            ...camposRecurrencia,
            descripcion: descripcion || null,
            clienteId: Number(clienteIdRaizFinal),
            color,
            estadoId: Number(estadoId),
            ...(!tarea && { parentId: null }),
          }
        : {
            ...camposRecurrencia,
            descripcion: descripcion || null,
            prioridad,
            estadoId: Number(estadoId),
            horasEstimadas: horasEstimadas ? Number(horasEstimadas) : null,
            imprevista,
            ...(!tarea && { parentId: Number(parentIdFijo ?? parentIdCascada) }),
          };
      const resultado = tarea
        ? await apiPatch<TareaItem>(`/api/tareas/${tarea.id}`, payload)
        : await apiPost<TareaItem>("/api/tareas", payload);
      onGuardado(resultado);
      if (!tarea) {
        setNombre("");
        setDescripcion("");
        setHorasEstimadas("");
        setRecurrente(false);
        setIntervalo("1");
        setTipoTrabajoId("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const hijosOrdenados = tarea
    ? [...hijosDirectos(tarea.id, tareas)].sort((a, b) => a.orden - b.orden)
    : [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  async function handleDragEndHijos(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = hijosOrdenados.findIndex((h) => h.id === active.id);
    const newIndex = hijosOrdenados.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordenados = arrayMove(hijosOrdenados, oldIndex, newIndex);
    await Promise.all(
      reordenados.map(async (hijo, index) => {
        if (hijo.orden === index) return;
        const actualizado = await apiPatch<TareaItem>(`/api/tareas/${hijo.id}`, { orden: index });
        onSincronizar(actualizado);
      }),
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Descripción</Label>
          <Textarea
            rows={2}
            value={descripcion ?? ""}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className="col-span-2 space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              id="recurrente"
              type="checkbox"
              checked={recurrente}
              onChange={(e) => setRecurrente(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[var(--accent-primary)] dark:border-slate-700"
            />
            <label
              htmlFor="recurrente"
              className="text-sm text-slate-700 dark:text-slate-300"
            >
              Recurrente
            </label>
          </div>
          {recurrente && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frecuencia</Label>
                <Select
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}
                >
                  {(Object.keys(FRECUENCIA_LABEL) as Frecuencia[]).map((f) => (
                    <option key={f} value={f}>
                      {FRECUENCIA_LABEL[f]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Cada</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={intervalo}
                  onChange={(e) => setIntervalo(e.target.value)}
                />
              </div>
              <p className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                Se va a llamar:{" "}
                <span className="font-medium">
                  {nombre ? nombreConPeriodo(nombre, frecuencia, fechaPeriodo) : "…"}
                </span>
              </p>
            </div>
          )}
        </div>

        <div>
          <Label>Tipo de trabajo</Label>
          <Select
            value={tipoTrabajoId}
            onChange={(e) => setTipoTrabajoId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Sin definir</option>
            {tiposActivos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </Select>
        </div>

        {esRaiz ? (
          <>
            {clientes && (
              <div>
                <Label>Cliente</Label>
                <Select
                  value={clienteIdRaiz}
                  onChange={(e) => setClienteIdRaiz(Number(e.target.value))}
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label>Color</Label>
              <ColorSwatchPicker
                colorPrincipal={colorPrincipal}
                value={color}
                onChange={setColor}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estadoId} onChange={(e) => setEstadoId(Number(e.target.value))}>
                {estadosOrdenados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </Select>
            </div>
          </>
        ) : (
          <>
            {mostrarCascadaPadre ? (
              <>
                {clientes && (
                  <div>
                    <Label>Cliente</Label>
                    <Select
                      value={clienteCascada}
                      onChange={(e) => cambiarClienteCascada(Number(e.target.value))}
                    >
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Proyecto</Label>
                  <Select
                    value={parentIdCascada}
                    onChange={(e) => setParentIdCascada(Number(e.target.value))}
                  >
                    {raicesFiltradas.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            ) : (
              breadcrumb.length > 0 && (
                <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                  {breadcrumb[0]?.cliente?.nombre && `${breadcrumb[0].cliente.nombre} · `}
                  {breadcrumb.map((t) => t.nombre).join(" › ")}
                </div>
              )
            )}
            <div>
              <Label>Estado</Label>
              <Select value={estadoId} onChange={(e) => setEstadoId(Number(e.target.value))}>
                {estadosOrdenados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORIDAD_LABEL[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Horas estimadas</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={horasEstimadas}
                onChange={(e) => setHorasEstimadas(e.target.value)}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input
                id="imprevista"
                type="checkbox"
                checked={imprevista}
                onChange={(e) => setImprevista(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[var(--accent-primary)] dark:border-slate-700"
              />
              <label
                htmlFor="imprevista"
                className="text-sm text-slate-700 dark:text-slate-300"
              >
                Tarea imprevista
              </label>
            </div>
          </>
        )}
      </div>

      {tarea && (
        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <Label>Subtareas</Label>
            <button
              type="button"
              onClick={() => onDrillIn({ parentId: tarea.id })}
              className="flex items-center gap-0.5 text-xs font-medium text-slate-400 hover:text-[var(--accent-primary)] hover:underline dark:text-slate-500"
            >
              <Plus size={11} /> Agregar subtarea
            </button>
          </div>
          {hijosOrdenados.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Sin subtareas.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndHijos}
              >
                <SortableContext
                  items={hijosOrdenados.map((h) => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {hijosOrdenados.map((h) => (
                    <SortableRow key={h.id} id={h.id}>
                      <button
                        type="button"
                        onClick={() => onDrillIn({ tarea: h })}
                        className="flex flex-1 items-center gap-2 text-left text-sm text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: h.estado?.color }}
                        />
                        <span className="flex-1 truncate">{h.nombre}</span>
                        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                          {h.estado?.nombre}
                        </span>
                      </button>
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
            </ul>
          )}
        </div>
      )}

      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button onClick={guardar} disabled={!puedeGuardar || saving}>
          {tarea ? "Guardar cambios" : esRaiz ? "Crear proyecto" : "Crear tarea"}
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
