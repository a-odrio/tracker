import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registroTiempoUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = registroTiempoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { fecha, ...rest } = parsed.data;
  const registro = await prisma.registroTiempo.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      ...(fecha !== undefined && { fecha: new Date(fecha) }),
    },
    include: {
      proyecto: { include: { cliente: true } },
      tarea: true,
      tipoTrabajo: true,
    },
  });
  return NextResponse.json(registro);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.registroTiempo.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
