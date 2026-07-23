import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { avanzarEstadoSiInicial } from "@/lib/estados-flujo";
import { registroTiempoSchema } from "@/lib/validation";

const tareaInclude = { include: { estado: true } } as const;

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
      tarea: tareaInclude,
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

  if (parsed.data.tareaId) {
    if (parsed.data.tareaEstadoId) {
      await prisma.tarea.update({
        where: { id: parsed.data.tareaId },
        data: { estadoId: parsed.data.tareaEstadoId },
      });
    } else {
      await avanzarEstadoSiInicial(parsed.data.tareaId);
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
      tarea: tareaInclude,
      tipoTrabajo: true,
    },
  });
  return NextResponse.json(registro, { status: 201 });
}
