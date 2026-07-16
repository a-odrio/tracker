"use client";

import { useState } from "react";
import { apiDelete, apiPatch, apiPost } from "@/lib/api-client";
import type { ClienteItem, ColorPaletaItem, ProyectoItem } from "@/lib/types";
import { ColorSwatchPicker } from "@/components/config/color-swatch-picker";
import { Button, ErrorText, Input, Section } from "@/components/ui";

export function ClientesProyectosConfig({
  clientes,
  paleta,
  onChange,
}: {
  clientes: ClienteItem[];
  paleta: ColorPaletaItem[];
  onChange: (clientes: ClienteItem[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(paleta[0]?.valorHex ?? "#3b82f6");
  const [error, setError] = useState("");

  async function agregarCliente() {
    setError("");
    try {
      const cliente = await apiPost<ClienteItem>("/api/clientes", { nombre, color });
      onChange([...clientes, { ...cliente, proyectos: [] }]);
      setNombre("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleActivo(cliente: ClienteItem) {
    const actualizado = await apiPatch<ClienteItem>(`/api/clientes/${cliente.id}`, {
      activo: !cliente.activo,
    });
    onChange(
      clientes.map((c) =>
        c.id === cliente.id ? { ...actualizado, proyectos: c.proyectos } : c,
      ),
    );
  }

  async function eliminarCliente(id: number) {
    setError("");
    try {
      await apiDelete(`/api/clientes/${id}`);
      onChange(clientes.filter((c) => c.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function actualizarProyectos(clienteId: number, proyectos: ProyectoItem[]) {
    onChange(
      clientes.map((c) => (c.id === clienteId ? { ...c, proyectos } : c)),
    );
  }

  return (
    <Section title="Clientes y proyectos">
      <div className="mb-5 space-y-4">
        {clientes.map((cliente) => (
          <ClienteRow
            key={cliente.id}
            cliente={cliente}
            paleta={paleta}
            onToggleActivo={() => toggleActivo(cliente)}
            onEliminar={() => eliminarCliente(cliente.id)}
            onProyectosChange={(p) => actualizarProyectos(cliente.id, p)}
          />
        ))}
        {clientes.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Todavía no hay clientes.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Nuevo cliente
          </label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del cliente"
            className="w-52"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
            Color
          </label>
          <ColorSwatchPicker paleta={paleta} value={color} onChange={setColor} />
        </div>
        <Button onClick={agregarCliente} disabled={!nombre}>
          Agregar cliente
        </Button>
      </div>
      <ErrorText>{error}</ErrorText>
    </Section>
  );
}

function ClienteRow({
  cliente,
  paleta,
  onToggleActivo,
  onEliminar,
  onProyectosChange,
}: {
  cliente: ClienteItem;
  paleta: ColorPaletaItem[];
  onToggleActivo: () => void;
  onEliminar: () => void;
  onProyectosChange: (proyectos: ProyectoItem[]) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [colorProyecto, setColorProyecto] = useState(
    paleta[0]?.valorHex ?? "#3b82f6",
  );
  const [error, setError] = useState("");
  const proyectos = cliente.proyectos ?? [];

  async function agregarProyecto() {
    setError("");
    try {
      const proyecto = await apiPost<ProyectoItem>("/api/proyectos", {
        clienteId: cliente.id,
        nombre: nombreProyecto,
        color: colorProyecto,
      });
      onProyectosChange([...proyectos, proyecto]);
      setNombreProyecto("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleProyectoActivo(proyecto: ProyectoItem) {
    const actualizado = await apiPatch<ProyectoItem>(
      `/api/proyectos/${proyecto.id}`,
      { activo: !proyecto.activo },
    );
    onProyectosChange(
      proyectos.map((p) => (p.id === proyecto.id ? actualizado : p)),
    );
  }

  async function eliminarProyecto(id: number) {
    setError("");
    try {
      await apiDelete(`/api/proyectos/${id}`);
      onProyectosChange(proyectos.filter((p) => p.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setExpandido((v) => !v)}
          className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          {expandido ? "▾" : "▸"}
        </button>
        <span
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: cliente.color }}
        />
        <span
          className={`flex-1 text-sm font-medium ${cliente.activo ? "text-slate-900 dark:text-slate-100" : "text-slate-400 line-through dark:text-slate-600"}`}
        >
          {cliente.nombre}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {proyectos.length} proyecto(s)
        </span>
        <button
          onClick={onToggleActivo}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          {cliente.activo ? "Archivar" : "Activar"}
        </button>
        <button
          onClick={onEliminar}
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
          title="Eliminar"
        >
          ×
        </button>
      </div>
      {expandido && (
        <div className="border-t border-slate-100 p-3 pl-10 dark:border-slate-800">
          <ul className="mb-3 divide-y divide-slate-100 dark:divide-slate-800">
            {proyectos.map((proyecto) => (
              <li key={proyecto.id} className="flex items-center gap-3 py-2">
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: proyecto.color }}
                />
                <span
                  className={`flex-1 text-sm ${proyecto.activo ? "text-slate-800 dark:text-slate-200" : "text-slate-400 line-through dark:text-slate-600"}`}
                >
                  {proyecto.nombre}
                </span>
                <button
                  onClick={() => toggleProyectoActivo(proyecto)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {proyecto.activo ? "Archivar" : "Activar"}
                </button>
                <button
                  onClick={() => eliminarProyecto(proyecto.id)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Eliminar"
                >
                  ×
                </button>
              </li>
            ))}
            {proyectos.length === 0 && (
              <p className="py-1 text-sm text-slate-500 dark:text-slate-400">
                Sin proyectos todavía.
              </p>
            )}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Nuevo proyecto
              </label>
              <Input
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                placeholder="Nombre del proyecto"
                className="w-52"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Color
              </label>
              <ColorSwatchPicker
                paleta={paleta}
                value={colorProyecto}
                onChange={setColorProyecto}
              />
            </div>
            <Button onClick={agregarProyecto} disabled={!nombreProyecto}>
              Agregar proyecto
            </Button>
          </div>
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </div>
  );
}
