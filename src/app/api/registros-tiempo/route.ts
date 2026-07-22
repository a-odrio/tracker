import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registroTiempoSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const desde = request.nextUrl.searchParams.get("desde");
  const hasta = request.nextUrl.searchParams.get("hasta");
  const registros = await prisma.registroTiempo.findMany({
    where:
      desde && hasta
        ? { fecha: { gte: new Date(desde), lte: new Date(hasta) } }
        : {},
    include: {
      proyecto: { include: { cliente: true } },
      tarea: true,
      tipoTrabajo: true,
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
  });
  return NextResponse.json(registros);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registroTiempoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Regla fija: registrar trabajo en una tarea que sigue en el estado inicial
  // la hace avanzar automáticamente al siguiente estado.
  if (parsed.data.tareaId) {
    const tarea = await prisma.tarea.findUnique({
      where: { id: parsed.data.tareaId },
      include: { estado: true },
    });
    if (tarea?.estado?.esInicial) {
      const siguiente = await prisma.estado.findFirst({
        where: { orden: { gt: tarea.estado.orden } },
        orderBy: { orden: "asc" },
      });
      if (siguiente) {
        await prisma.tarea.update({
          where: { id: tarea.id },
          data: { estadoId: siguiente.id },
        });
      }
    }
  }

  const registro = await prisma.registroTiempo.create({
    data: {
      fecha: new Date(parsed.data.fecha),
      proyectoId: parsed.data.proyectoId,
      tareaId: parsed.data.tareaId ?? null,
      tipoTrabajoId: parsed.data.tipoTrabajoId,
      horaInicio: parsed.data.horaInicio,
      horaFin: parsed.data.horaFin,
      comentarios: parsed.data.comentarios || null,
    },
    include: {
      proyecto: { include: { cliente: true } },
      tarea: true,
      tipoTrabajo: true,
    },
  });
  return NextResponse.json(registro, { status: 201 });
}
