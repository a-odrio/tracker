import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { colorPaletaSchema } from "@/lib/validation";

export async function GET() {
  const paleta = await prisma.colorPaleta.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json(paleta);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = colorPaletaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.orden === undefined) {
    const max = await prisma.colorPaleta.aggregate({ _max: { orden: true } });
    parsed.data.orden = (max._max.orden ?? -1) + 1;
  }
  const color = await prisma.colorPaleta.create({ data: parsed.data });
  return NextResponse.json(color, { status: 201 });
}
