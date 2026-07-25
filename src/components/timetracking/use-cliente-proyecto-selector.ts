import { useState } from "react";
import type { ClienteItem, TareaItem } from "@/lib/types";

/**
 * Selección Cliente→Proyecto en cascada, compartida entre TimerBar y
 * TimeEntryForm: al cambiar de cliente, si el proyecto elegido ya no
 * pertenece a ese cliente salta al primer proyecto disponible (o a 0 si no
 * hay ninguno). `onProyectoCambiado` avisa ese salto para que quien llama
 * decida qué hacer con su propia selección de tarea (cada uno lo maneja
 * distinto: TimerBar solo reasigna `tareaId`, TimeEntryForm también
 * recalcula el estado por defecto).
 */
export function useClienteProyectoSelector({
  clientes,
  tareas,
  clienteInicial,
  proyectoInicial,
  onProyectoCambiado,
}: {
  clientes: ClienteItem[];
  tareas: TareaItem[];
  clienteInicial?: number;
  proyectoInicial?: number;
  onProyectoCambiado: (proyectoId: number) => void;
}) {
  const clienteIdInicial =
    clienteInicial ?? clientes.find((c) => c.predeterminado)?.id ?? clientes[0]?.id ?? "";
  const [clienteId, setClienteId] = useState<number | "">(clienteIdInicial);
  const raicesDelClienteInicial = tareas.filter(
    (t) => t.parentId === null && t.clienteId === clienteIdInicial,
  );
  const [proyectoId, setProyectoId] = useState(
    proyectoInicial ?? raicesDelClienteInicial[0]?.id ?? 0,
  );

  const proyectosFiltrados = tareas.filter(
    (t) => t.parentId === null && (!clienteId || t.clienteId === clienteId),
  );

  function cambiarCliente(id: number) {
    setClienteId(id);
    const disponibles = tareas.filter((t) => t.parentId === null && t.clienteId === id);
    if (!disponibles.some((t) => t.id === proyectoId)) {
      const nuevoProyectoId = disponibles[0]?.id ?? 0;
      setProyectoId(nuevoProyectoId);
      onProyectoCambiado(nuevoProyectoId);
    }
  }

  function cambiarProyecto(id: number) {
    setProyectoId(id);
    onProyectoCambiado(id);
  }

  return {
    clienteId,
    setClienteId,
    proyectoId,
    setProyectoId,
    proyectosFiltrados,
    cambiarCliente,
    cambiarProyecto,
  };
}
