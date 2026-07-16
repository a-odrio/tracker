"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import type { EstadoItem, ProyectoItem } from "@/lib/types";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [proyecto, setProyecto] = useState<ProyectoItem | null>(null);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<ProyectoItem>(`/api/proyectos/${id}`),
      apiGet<EstadoItem[]>("/api/estados"),
    ])
      .then(([p, e]) => {
        setProyecto(p);
        setEstados(e);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>;
  }

  if (!proyecto) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Proyecto no encontrado.{" "}
        <Link href="/proyectos" className="underline">
          Volver
        </Link>
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/proyectos"
        className="mb-3 inline-block w-fit text-xs text-slate-500 hover:underline dark:text-slate-400"
      >
        ← Proyectos
      </Link>
      <KanbanBoard proyecto={proyecto} estados={estados} />
    </div>
  );
}
