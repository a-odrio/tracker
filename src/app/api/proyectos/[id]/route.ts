import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proyectoSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: Number(id) },
    include: { cliente: true },
  });
  if (!proyecto) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(proyecto);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = proyectoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const proyecto = await prisma.proyecto.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(proyecto);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.proyecto.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene tareas o registros asociados. Archivalo en su lugar." },
      { status: 409 },
    );
  }
}
