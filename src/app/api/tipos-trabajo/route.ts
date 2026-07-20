import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tipoTrabajoSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const incluirInactivos =
    request.nextUrl.searchParams.get("incluirInactivos") === "true";
  const tipos = await prisma.tipoTrabajo.findMany({
    where: incluirInactivos ? {} : { activo: true },
    orderBy: { orden: "asc" },
  });
  return NextResponse.json(tipos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = tipoTrabajoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.orden === undefined) {
    const max = await prisma.tipoTrabajo.aggregate({ _max: { orden: true } });
    parsed.data.orden = (max._max.orden ?? -1) + 1;
  }
  const tipo = await prisma.tipoTrabajo.create({ data: parsed.data });
  return NextResponse.json(tipo, { status: 201 });
}
