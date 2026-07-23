import { prisma } from "@/lib/db";

/**
 * Regla fija: registrar trabajo en una tarea que sigue en el estado inicial
 * la hace avanzar automáticamente al siguiente estado (por orden). No hace
 * nada si la tarea ya salió del estado inicial o si no hay un estado siguiente.
 */
export async function avanzarEstadoSiInicial(tareaId: number) {
  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: { estado: true },
  });
  if (!tarea?.estado?.esInicial) return;
  const siguiente = await prisma.estado.findFirst({
    where: { orden: { gt: tarea.estado.orden } },
    orderBy: { orden: "asc" },
  });
  if (siguiente) {
    await prisma.tarea.update({
      where: { id: tarea.id },
      data: { estadoId: siguiente.id },
    });
  }
}
