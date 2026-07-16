/*
  Warnings:

  - You are about to drop the `ColorPaleta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ColorPaleta";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Tema" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "colorPrincipal" TEXT NOT NULL DEFAULT '#3b82f6'
);
