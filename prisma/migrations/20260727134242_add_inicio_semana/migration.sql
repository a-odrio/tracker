-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tema" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "colorPrincipal" TEXT NOT NULL DEFAULT '#3b82f6',
    "avisoTimerHoras" REAL NOT NULL DEFAULT 4,
    "inicioSemana" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_Tema" ("avisoTimerHoras", "colorPrincipal", "id") SELECT "avisoTimerHoras", "colorPrincipal", "id" FROM "Tema";
DROP TABLE "Tema";
ALTER TABLE "new_Tema" RENAME TO "Tema";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
