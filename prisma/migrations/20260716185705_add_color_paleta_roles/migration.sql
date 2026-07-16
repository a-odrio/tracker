-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ColorPaleta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "valorHex" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "secundario" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_ColorPaleta" ("id", "nombre", "orden", "valorHex") SELECT "id", "nombre", "orden", "valorHex" FROM "ColorPaleta";
DROP TABLE "ColorPaleta";
ALTER TABLE "new_ColorPaleta" RENAME TO "ColorPaleta";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
