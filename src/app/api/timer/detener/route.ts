import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { avanzarEstadoSiInicial } from "@/lib/estados-flujo";
import { minutesToTime, timeToMinutes, toDateOnlyISO } from "@/lib/utils";

function horaTexto(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export async function POST() {
  const timer = await prisma.timerActivo.findFirst();
  if (!timer) {
    return NextResponse.json({ error: "No hay ningún timer en curso." }, { status: 404 });
  }

  const inicio = timer.inicio;
  const fin = new Date();
  const mismoDia = inicio.toDateString() === fin.toDateString();

  const horaInicio = horaTexto(inicio);
  let horaFin = mismoDia ? horaTexto(fin) : "23:59";
  // Garantiza una duración mínima de 1 minuto, incluso si se detuvo casi al
  // instante o si el timer cruzó la medianoche (el modelo no soporta
  // registros de más de un día, así que se recorta al final de ese día).
  if (timeToMinutes(horaFin) <= timeToMinutes(horaInicio)) {
    horaFin = minutesToTime(Math.min(timeToMinutes(horaInicio) + 1, 23 * 60 + 59));
  }

  if (timer.tareaId) {
    await avanzarEstadoSiInicial(timer.tareaId);
  }

  const registro = await prisma.registroTiempo.create({
    data: {
      fecha: new Date(toDateOnlyISO(inicio)),
      proyectoId: timer.proyectoId,
      tareaId: timer.tareaId,
      tipoTrabajoId: timer.tipoTrabajoId,
      horaInicio,
      horaFin,
      comentarios: timer.comentarios,
    },
    include: {
      proyecto: { include: { cliente: true } },
      tarea: true,
      tipoTrabajo: true,
    },
  });

  await prisma.timerActivo.delete({ where: { id: timer.id } });

  return NextResponse.json(registro);
}
