-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentId" INTEGER,
    "clienteId" INTEGER,
    "color" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estadoId" INTEGER NOT NULL,
    "horasEstimadas" REAL,
    "imprevista" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "ordenEstado" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurrente" BOOLEAN NOT NULL DEFAULT false,
    "recurrenciaFrecuencia" TEXT,
    "recurrenciaIntervalo" INTEGER,
    "nombreBase" TEXT,
    "serieId" INTEGER,
    CONSTRAINT "Tarea_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Tarea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tarea" ("activo", "clienteId", "color", "createdAt", "descripcion", "estadoId", "horasEstimadas", "id", "imprevista", "nombre", "orden", "ordenEstado", "parentId", "prioridad") SELECT "activo", "clienteId", "color", "createdAt", "descripcion", "estadoId", "horasEstimadas", "id", "imprevista", "nombre", "orden", "ordenEstado", "parentId", "prioridad" FROM "Tarea";
DROP TABLE "Tarea";
ALTER TABLE "new_Tarea" RENAME TO "Tarea";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
