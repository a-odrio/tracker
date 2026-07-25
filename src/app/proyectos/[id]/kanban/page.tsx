"use client";

import { use } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/app-data";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tareas, estados, tema, loading } = useAppData();
  const raiz = tareas.find((t) => t.id === Number(id)) ?? null;

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
