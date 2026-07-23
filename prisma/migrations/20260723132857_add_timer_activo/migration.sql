-- CreateTable
CREATE TABLE "TimerActivo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "proyectoId" INTEGER NOT NULL,
    "tareaId" INTEGER,
    "tipoTrabajoId" INTEGER NOT NULL,
    "inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarios" TEXT,
    CONSTRAINT "TimerActivo_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimerActivo_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimerActivo_tipoTrabajoId_fkey" FOREIGN KEY ("tipoTrabajoId") REFERENCES "TipoTrabajo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
