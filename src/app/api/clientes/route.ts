import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clienteSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const incluirArchivados =
    request.nextUrl.searchParams.get("incluirArchivados") === "true";
  const clientes = await prisma.cliente.findMany({
    where: incluirArchivados ? {} : { activo: true },
    include: { proyectos: { where: incluirArchivados ? {} : { activo: true } } },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = clienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const cliente = await prisma.cliente.create({ data: parsed.data });
  return NextResponse.json(cliente, { status: 201 });
}
