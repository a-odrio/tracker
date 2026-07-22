import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { estadoSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = estadoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const estado = await prisma.estado.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(estado);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const estado = await prisma.estado.findUnique({ where: { id: Number(id) } });
  if (estado?.esInicial || estado?.esFinal) {
    return NextResponse.json(
      { error: "El estado inicial y el final son fijos: no se pueden eliminar." },
      { status: 400 },
    );
  }
  try {
    await prisma.estado.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: hay tareas usando este estado." },
      { status: 409 },
    );
  }
}
