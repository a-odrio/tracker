import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tareaSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";
import type { Prioridad } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const clienteId = params.get("clienteId");
  const proyectoId = params.get("proyectoId");
  const estadoId = params.get("estadoId");
  const prioridad = params.get("prioridad");

  const where: Prisma.TareaWhereInput = {};
  if (proyectoId) where.proyectoId = Number(proyectoId);
  if (clienteId) where.proyecto = { clienteId: Number(clienteId) };
  if (estadoId) where.estadoId = Number(estadoId);
  if (prioridad) where.prioridad = prioridad as Prioridad;

  const tareas = await prisma.tarea.findMany({
    where,
    include: { proyecto: { include: { cliente: true } }, estado: true },
    orderBy: [{ estadoId: "asc" }, { orden: "asc" }],
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
      where: { estadoId: parsed.data.estadoId },
    });
    parsed.data.orden = (max._max.orden ?? -1) + 1;
  }
  const tarea = await prisma.tarea.create({
    data: parsed.data,
    include: { proyecto: { include: { cliente: true } }, estado: true },
  });
  return NextResponse.json(tarea, { status: 201 });
}
