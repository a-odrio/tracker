import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const paletaCount = await prisma.colorPaleta.count();
  if (paletaCount === 0) {
    await prisma.colorPaleta.createMany({
      data: [
        { nombre: "Azul", valorHex: "#3b82f6", orden: 0 },
        { nombre: "Verde", valorHex: "#22c55e", orden: 1 },
        { nombre: "Ámbar", valorHex: "#f59e0b", orden: 2 },
        { nombre: "Rojo", valorHex: "#ef4444", orden: 3 },
        { nombre: "Violeta", valorHex: "#8b5cf6", orden: 4 },
        { nombre: "Rosa", valorHex: "#ec4899", orden: 5 },
        { nombre: "Cian", valorHex: "#06b6d4", orden: 6 },
        { nombre: "Gris", valorHex: "#6b7280", orden: 7 },
      ],
    });
  }

  const estadoCount = await prisma.estado.count();
  if (estadoCount === 0) {
    await prisma.estado.createMany({
      data: [
        { nombre: "Pendiente", orden: 0, color: "#6b7280" },
        { nombre: "En curso", orden: 1, color: "#3b82f6" },
        { nombre: "En revisión", orden: 2, color: "#f59e0b" },
        { nombre: "Terminada", orden: 3, color: "#22c55e" },
      ],
    });
  }

  const tipoTrabajoCount = await prisma.tipoTrabajo.count();
  if (tipoTrabajoCount === 0) {
    await prisma.tipoTrabajo.createMany({
      data: [
        { nombre: "Reunión" },
        { nombre: "Desarrollo" },
        { nombre: "Análisis" },
        { nombre: "Diseño" },
        { nombre: "Administración" },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
