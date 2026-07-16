import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { planificacionSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = planificacionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const item = await prisma.planificacionSemana.update({
    where: { id: Number(id) },
    data: {
      ...(parsed.data.tareaId !== undefined && { tareaId: parsed.data.tareaId }),
      ...(parsed.data.fecha !== undefined && { fecha: new Date(parsed.data.fecha) }),
      ...(parsed.data.horasPlanificadas !== undefined && {
        horasPlanificadas: parsed.data.horasPlanificadas,
      }),
    },
    include: {
      tarea: { include: { proyecto: { include: { cliente: true } }, estado: true } },
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.planificacionSemana.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
