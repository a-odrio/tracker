import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clienteSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = clienteSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const cliente = await prisma.cliente.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(cliente);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.cliente.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene proyectos asociados. Archivalo en su lugar." },
      { status: 409 },
    );
  }
}
