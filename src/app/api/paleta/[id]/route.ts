import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { colorPaletaSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = colorPaletaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const color = await prisma.colorPaleta.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(color);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.colorPaleta.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
