import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calendarioExternoSchema } from "@/lib/validation";

export async function GET() {
  const calendarios = await prisma.calendarioExterno.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(calendarios);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = calendarioExternoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const calendario = await prisma.calendarioExterno.create({ data: parsed.data });
  return NextResponse.json(calendario, { status: 201 });
}
