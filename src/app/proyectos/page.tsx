"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import type { ClienteItem } from "@/lib/types";

export default function ProyectosPage() {
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<ClienteItem[]>("/api/clientes")
      .then((data) => {
        setClientes(data);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar los proyectos: {error}
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Proyectos
      </h1>
      {clientes.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay clientes. Creá uno en{" "}
          <Link href="/configuracion" className="underline">
            Configuración
          </Link>
          .
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((cliente) => (
          <div
            key={cliente.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: cliente.color }}
              />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {cliente.nombre}
              </h2>
            </div>
            <ul className="space-y-1.5">
              {(cliente.proyectos ?? []).map((proyecto) => (
                <li key={proyecto.id}>
                  <Link
                    href={`/proyectos/${proyecto.id}/kanban`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: proyecto.color }}
                    />
                    {proyecto.nombre}
                  </Link>
                </li>
              ))}
              {(cliente.proyectos ?? []).length === 0 && (
                <li className="px-2 py-1 text-sm text-slate-400 dark:text-slate-600">
                  Sin proyectos
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
