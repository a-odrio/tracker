import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tareaSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";
import type { Prioridad } from "@/generated/prisma/enums";

const include = { cliente: true, parent: true, estado: true, tipoTrabajo: true } as const;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parentId = params.get("parentId");
  const estadoId = params.get("estadoId");
  const prioridad = params.get("prioridad");

  const where: Prisma.TareaWhereInput = {};
  if (parentId) where.parentId = parentId === "null" ? null : Number(parentId);
  if (estadoId) where.estadoId = Number(estadoId);
  if (prioridad) where.prioridad = prioridad as Prioridad;

  const tareas = await prisma.tarea.findMany({
    where,
    include,
    orderBy: [{ estadoId: "asc" }, { ordenEstado: "asc" }],
  });
  return NextResponse.json(tareas);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = tareaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.orden === undefined) {
    const max = await prisma.tarea.aggregate({
      _max: { orden: true },
      where:
        parsed.data.parentId != null
          ? { parentId: parsed.data.parentId }
          : { parentId: null, clienteId: parsed.data.clienteId },
    });
    parsed.data.orden = (max._max.orden ?? -1) + 1;
  }
  if (parsed.data.ordenEstado === undefined) {
    const max = await prisma.tarea.aggregate({
      _max: { ordenEstado: true },
      where: { estadoId: parsed.data.estadoId },
    });
    parsed.data.ordenEstado = (max._max.ordenEstado ?? -1) + 1;
  }
  const tarea = await prisma.tarea.create({
    data: parsed.data,
    include,
  });
  return NextResponse.json(tarea, { status: 201 });
}
