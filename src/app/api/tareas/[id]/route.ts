import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tareaSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = tareaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const tarea = await prisma.tarea.update({
    where: { id: Number(id) },
    data: parsed.data,
    include: { proyecto: { include: { cliente: true } }, estado: true },
  });
  return NextResponse.json(tarea);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.tarea.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene registros de tiempo o planificación asociados." },
      { status: 409 },
    );
  }
}
