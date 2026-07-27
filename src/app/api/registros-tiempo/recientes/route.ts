import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const tareaInclude = { include: { cliente: true, estado: true } } as const;

/** Últimos combos tarea+tipo realmente logueados (uno por combo, el más
 * reciente) — alimenta los accesos directos de /registro. Se derivan de
 * RegistroTiempo en vez de guardarse aparte en el navegador, para que viajen
 * con la base de datos el día que la app se sincronice entre dispositivos. */
export async function GET() {
  const recientes = await prisma.registroTiempo.findMany({
    distinct: ["tareaId", "tipoTrabajoId"],
    orderBy: { createdAt: "desc" },
    take: 4,
    include: {
      tarea: tareaInclude,
      tipoTrabajo: true,
    },
  });
  return NextResponse.json(recientes);
}
