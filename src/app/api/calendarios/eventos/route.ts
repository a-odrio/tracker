import { NextRequest, NextResponse } from "next/server";
import ical, { type CalendarResponse, type VEvent } from "node-ical";
import { prisma } from "@/lib/db";
import type { EventoCalendarioItem } from "@/lib/types";

/// Un feed ICS externo no cambia tan seguido como para justificar
/// refrescarlo cada pocos minutos — 6 horas alcanza para que un calentado al
/// abrir la app (ver AppDataProvider) siga sirviendo el resto del día.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cacheICS = new Map<string, { data: CalendarResponse; ts: number }>();

async function obtenerICS(url: string): Promise<CalendarResponse> {
  const cacheado = cacheICS.get(url);
  if (cacheado && Date.now() - cacheado.ts < CACHE_TTL_MS) return cacheado.data;
  const data = await ical.async.fromURL(url);
  cacheICS.set(url, { data, ts: Date.now() });
  return data;
}

function tituloDe(summary: VEvent["summary"]): string {
  if (!summary) return "(Sin título)";
  return typeof summary === "string" ? summary : summary.val;
}

/** Eventos de un calendario dentro de [desde, hasta), expandiendo recurrencias
 * — los eventos de día completo (sin horario) se dejan afuera: la grilla de
 * Registro es por hora, no tiene una fila para "todo el día". */
async function eventosDeCalendario(
  calendario: { id: number; urlIcs: string; color: string },
  desde: Date,
  hasta: Date,
): Promise<EventoCalendarioItem[]> {
  const data = await obtenerICS(calendario.urlIcs);
  const eventos: EventoCalendarioItem[] = [];

  for (const key in data) {
    const item = data[key];
    if (!item || item.type !== "VEVENT") continue;
    const vevent = item as VEvent;

    if (vevent.rrule) {
      const instancias = ical.expandRecurringEvent(vevent, { from: desde, to: hasta });
      for (const inst of instancias) {
        if (inst.isFullDay) continue;
        eventos.push({
          calendarioId: calendario.id,
          uid: `${vevent.uid}-${inst.start.toISOString()}`,
          titulo: tituloDe(inst.summary),
          inicio: inst.start.toISOString(),
          fin: inst.end.toISOString(),
          color: calendario.color,
        });
      }
      continue;
    }

    if (
      vevent.datetype !== "date" &&
      vevent.start &&
      vevent.end &&
      vevent.start < hasta &&
      vevent.end > desde
    ) {
      eventos.push({
        calendarioId: calendario.id,
        uid: vevent.uid,
        titulo: tituloDe(vevent.summary),
        inicio: vevent.start.toISOString(),
        fin: vevent.end.toISOString(),
        color: calendario.color,
      });
    }
  }

  return eventos;
}

export async function GET(request: NextRequest) {
  const desdeStr = request.nextUrl.searchParams.get("desde");
  const hastaStr = request.nextUrl.searchParams.get("hasta");
  const calendarioIdStr = request.nextUrl.searchParams.get("calendarioId");
  if (!desdeStr || !hastaStr) {
    return NextResponse.json({ error: "Faltan desde/hasta" }, { status: 400 });
  }
  const desde = new Date(`${desdeStr}T00:00:00`);
  const hasta = new Date(`${hastaStr}T23:59:59`);

  const calendarios = await prisma.calendarioExterno.findMany({
    where: {
      activo: true,
      ...(calendarioIdStr ? { id: Number(calendarioIdStr) } : {}),
    },
  });

  const resultados = await Promise.allSettled(
    calendarios.map((cal) => eventosDeCalendario(cal, desde, hasta)),
  );
  const eventos = resultados.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return NextResponse.json(eventos);
}
