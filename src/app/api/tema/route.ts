import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { temaSchema } from "@/lib/validation";

async function obtenerOCrearTema() {
  const existente = await prisma.tema.findFirst();
  if (existente) return existente;
  return prisma.tema.create({ data: {} });
}

export async function GET() {
  const tema = await obtenerOCrearTema();
  return NextResponse.json(tema);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = temaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const actual = await obtenerOCrearTema();
  const tema = await prisma.tema.update({
    where: { id: actual.id },
    data: parsed.data,
  });
  return NextResponse.json(tema);
}
