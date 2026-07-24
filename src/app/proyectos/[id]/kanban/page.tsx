"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import type { EstadoItem, TareaItem, TemaItem } from "@/lib/types";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [raiz, setRaiz] = useState<TareaItem | null>(null);
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tema, setTema] = useState<TemaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<TareaItem>(`/api/tareas/${id}`),
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TemaItem>("/api/tema"),
    ])
      .then(([t, e, tm]) => {
        setRaiz(t);
        setEstados(e);
        setTema(tm);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>;
  }

  if (!raiz || !tema) {
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
      <KanbanBoard raiz={raiz} estados={estados} colorPrincipal={tema.colorPrincipal} />
    </div>
  );
}
