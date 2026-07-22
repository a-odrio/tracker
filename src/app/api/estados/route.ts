import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { estadoSchema } from "@/lib/validation";

export async function GET() {
  const estados = await prisma.estado.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json(estados);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = estadoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // Los estados nuevos siempre entran como intermedios, insertados justo antes
  // del estado final (que se corre un lugar para hacerles espacio).
  if (parsed.data.orden === undefined) {
    const final = await prisma.estado.findFirst({ where: { esFinal: true } });
    if (final) {
      parsed.data.orden = final.orden;
      await prisma.estado.update({
        where: { id: final.id },
        data: { orden: final.orden + 1 },
      });
    } else {
      const max = await prisma.estado.aggregate({ _max: { orden: true } });
      parsed.data.orden = (max._max.orden ?? -1) + 1;
    }
  }
  const estado = await prisma.estado.create({ data: parsed.data });
  return NextResponse.json(estado, { status: 201 });
}
