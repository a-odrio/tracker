-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Estado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL,
    "mostrarEnBacklog" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Estado" ("color", "id", "nombre", "orden") SELECT "color", "id", "nombre", "orden" FROM "Estado";
DROP TABLE "Estado";
ALTER TABLE "new_Estado" RENAME TO "Estado";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Preserve prior behavior: the last column (by orden) was implicitly excluded
-- from the planning backlog; keep it excluded now that it's an explicit flag.
UPDATE "Estado" SET "mostrarEnBacklog" = false
WHERE "orden" = (SELECT MAX("orden") FROM "Estado");
