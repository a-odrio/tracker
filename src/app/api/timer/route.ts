import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { timerActivoSchema } from "@/lib/validation";

const include = {
  tarea: { include: { cliente: true, estado: true } },
  tipoTrabajo: true,
} as const;

export async function GET() {
  const timer = await prisma.timerActivo.findFirst({ include });
  return NextResponse.json(timer);
}

export async function POST(request: NextRequest) {
  const existente = await prisma.timerActivo.findFirst();
  if (existente) {
    return NextResponse.json(
      { error: "Ya hay un timer en curso. Detenelo antes de iniciar otro." },
      { status: 409 },
    );
  }
  const body = await request.json();
  const parsed = timerActivoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const timer = await prisma.timerActivo.create({
    data: {
      tareaId: parsed.data.tareaId,
      tipoTrabajoId: parsed.data.tipoTrabajoId,
      comentarios: parsed.data.comentarios || null,
    },
    include,
  });
  return NextResponse.json(timer, { status: 201 });
}

export async function DELETE() {
  const existente = await prisma.timerActivo.findFirst();
  if (existente) {
    await prisma.timerActivo.delete({ where: { id: existente.id } });
  }
  return NextResponse.json({ ok: true });
}
