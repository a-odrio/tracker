import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calendarioExternoSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = calendarioExternoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const calendario = await prisma.calendarioExterno.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(calendario);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.calendarioExterno.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
