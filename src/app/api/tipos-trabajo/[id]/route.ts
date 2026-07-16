import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tipoTrabajoSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = tipoTrabajoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const tipo = await prisma.tipoTrabajo.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(tipo);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.tipoTrabajo.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: hay registros de tiempo con este tipo. Desactivalo en su lugar." },
      { status: 409 },
    );
  }
}
