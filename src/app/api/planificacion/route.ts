import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { planificacionSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const desde = request.nextUrl.searchParams.get("desde");
  const hasta = request.nextUrl.searchParams.get("hasta");
  const planificacion = await prisma.planificacionSemana.findMany({
    where:
      desde && hasta
        ? { fecha: { gte: new Date(desde), lte: new Date(hasta) } }
        : {},
    include: {
      tarea: { include: { proyecto: { include: { cliente: true } }, estado: true } },
    },
    orderBy: { fecha: "asc" },
  });
  return NextResponse.json(planificacion);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = planificacionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const item = await prisma.planificacionSemana.create({
    data: {
      tareaId: parsed.data.tareaId,
      fecha: new Date(parsed.data.fecha),
      horasPlanificadas: parsed.data.horasPlanificadas,
    },
    include: {
      tarea: { include: { proyecto: { include: { cliente: true } }, estado: true } },
    },
  });
  return NextResponse.json(item, { status: 201 });
}
