import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proyectoSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const clienteId = request.nextUrl.searchParams.get("clienteId");
  const incluirArchivados =
    request.nextUrl.searchParams.get("incluirArchivados") === "true";
  const proyectos = await prisma.proyecto.findMany({
    where: {
      ...(clienteId ? { clienteId: Number(clienteId) } : {}),
      ...(incluirArchivados ? {} : { activo: true }),
    },
    include: { cliente: true },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(proyectos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = proyectoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const proyecto = await prisma.proyecto.create({ data: parsed.data });
  return NextResponse.json(proyecto, { status: 201 });
}
