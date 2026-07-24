import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tareaUpdateSchema } from "@/lib/validation";

const include = { cliente: true, parent: true, estado: true } as const;

/** true si `candidatoId` es `raizId` mismo o está anidado en cualquier
 * profundidad debajo de él — usado para bloquear reparenting cíclico. */
async function esDescendiente(raizId: number, candidatoId: number): Promise<boolean> {
  if (raizId === candidatoId) return true;
  const hijos = await prisma.tarea.findMany({ where: { parentId: raizId }, select: { id: true } });
  for (const hijo of hijos) {
    if (await esDescendiente(hijo.id, candidatoId)) return true;
  }
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tarea = await prisma.tarea.findUnique({
    where: { id: Number(id) },
    include,
  });
  if (!tarea) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(tarea);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = tareaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (
    parsed.data.parentId !== undefined &&
    parsed.data.parentId !== null &&
    (await esDescendiente(Number(id), parsed.data.parentId))
  ) {
    return NextResponse.json(
      { error: "No se puede mover una tarea dentro de su propio subárbol." },
      { status: 400 },
    );
  }
  const tarea = await prisma.tarea.update({
    where: { id: Number(id) },
    data: parsed.data,
    include,
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
      {
        error:
          "No se puede eliminar: tiene subtareas, registros de tiempo o planificación asociados.",
      },
      { status: 409 },
    );
  }
}
