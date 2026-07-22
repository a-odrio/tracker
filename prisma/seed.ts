import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const temaCount = await prisma.tema.count();
  if (temaCount === 0) {
    await prisma.tema.create({ data: { colorPrincipal: "#3b82f6" } });
  }

  const estadoCount = await prisma.estado.count();
  if (estadoCount === 0) {
    await prisma.estado.createMany({
      data: [
        { nombre: "Pendiente", orden: 0, color: "#6b7280", esInicial: true },
        { nombre: "En curso", orden: 1, color: "#3b82f6" },
        { nombre: "En revisión", orden: 2, color: "#f59e0b" },
        {
          nombre: "Terminada",
          orden: 3,
          color: "#22c55e",
          mostrarEnBacklog: false,
          esFinal: true,
        },
      ],
    });
  }

  const tipoTrabajoCount = await prisma.tipoTrabajo.count();
  if (tipoTrabajoCount === 0) {
    await prisma.tipoTrabajo.createMany({
      data: [
        { nombre: "Reunión", orden: 0 },
        { nombre: "Desarrollo", orden: 1 },
        { nombre: "Análisis", orden: 2 },
        { nombre: "Diseño", orden: 3 },
        { nombre: "Administración", orden: 4 },
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
