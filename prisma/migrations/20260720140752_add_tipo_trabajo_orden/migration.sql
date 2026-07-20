-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TipoTrabajo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_TipoTrabajo" ("activo", "id", "nombre") SELECT "activo", "id", "nombre" FROM "TipoTrabajo";
DROP TABLE "TipoTrabajo";
ALTER TABLE "new_TipoTrabajo" RENAME TO "TipoTrabajo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
