-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Proyecto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proyecto" ("activo", "clienteId", "color", "createdAt", "descripcion", "id", "nombre") SELECT "activo", "clienteId", "color", "createdAt", "descripcion", "id", "nombre" FROM "Proyecto";
DROP TABLE "Proyecto";
ALTER TABLE "new_Proyecto" RENAME TO "Proyecto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
