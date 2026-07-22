-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Estado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL,
    "mostrarEnBacklog" BOOLEAN NOT NULL DEFAULT true,
    "esInicial" BOOLEAN NOT NULL DEFAULT false,
    "esFinal" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Estado" ("color", "id", "mostrarEnBacklog", "nombre", "orden") SELECT "color", "id", "mostrarEnBacklog", "nombre", "orden" FROM "Estado";
DROP TABLE "Estado";
ALTER TABLE "new_Estado" RENAME TO "Estado";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Anchor the existing first/last columns (by orden) as the fixed inicial/final
-- roles, since every other estado already sits between them by definition.
UPDATE "Estado" SET "esInicial" = true
WHERE "orden" = (SELECT MIN("orden") FROM "Estado");

UPDATE "Estado" SET "esFinal" = true
WHERE "orden" = (SELECT MAX("orden") FROM "Estado");
