-- Fusiona Proyecto y Tarea en un solo modelo autoreferenciado (Tarea con
-- parentId). Los ids de Proyecto NO cambian (pasan a ser ids de tarea raíz
-- tal cual, por lo que Tarea.proyectoId antiguo ya es el parentId nuevo sin
-- traducir); los ids de Tarea se desplazan más allá del máximo id de
-- Proyecto para evitar colisiones. Se usa una tabla scratch _id_map para el
-- remapeo, siguiendo el patrón RedefineTables ya usado en este repo.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Paso 1: tabla de remapeo de ids.
CREATE TABLE "_id_map" (
  "kind"   TEXT    NOT NULL,
  "old_id" INTEGER NOT NULL,
  "new_id" INTEGER NOT NULL
);

INSERT INTO "_id_map" ("kind", "old_id", "new_id")
SELECT 'proyecto', "id", "id" FROM "Proyecto";

INSERT INTO "_id_map" ("kind", "old_id", "new_id")
SELECT 'tarea', "id", "id" + (SELECT COALESCE(MAX("id"), 0) FROM "Proyecto")
FROM "Tarea";

-- Paso 2: tabla unificada.
CREATE TABLE "new_Tarea" (
    "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentId"       INTEGER,
    "clienteId"      INTEGER,
    "color"          TEXT,
    "nombre"         TEXT NOT NULL,
    "descripcion"    TEXT,
    "activo"         BOOLEAN NOT NULL DEFAULT true,
    "prioridad"      TEXT NOT NULL DEFAULT 'MEDIA',
    "estadoId"       INTEGER NOT NULL,
    "horasEstimadas" REAL,
    "imprevista"     BOOLEAN NOT NULL DEFAULT false,
    "orden"          INTEGER NOT NULL DEFAULT 0,
    "ordenEstado"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tarea_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Tarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tarea_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Paso 3: filas de Proyecto -> raíces. estadoId se rellena con el estado
-- fijo esInicial (Proyecto no tenía estado propio).
INSERT INTO "new_Tarea"
  ("id","parentId","clienteId","color","nombre","descripcion","activo","prioridad","estadoId","horasEstimadas","imprevista","orden","ordenEstado","createdAt")
SELECT
  m."new_id", NULL, p."clienteId", p."color", p."nombre", p."descripcion", p."activo",
  'MEDIA', (SELECT "id" FROM "Estado" WHERE "esInicial" = true), NULL, false, p."orden", p."orden", p."createdAt"
FROM "Proyecto" p
JOIN "_id_map" m ON m."kind" = 'proyecto' AND m."old_id" = p."id";

-- Paso 4: filas de Tarea -> hijas. parentId = proyectoId viejo sin traducir
-- (ver nota arriba). ordenEstado hereda el Tarea.orden viejo (mismo campo,
-- renombrado); orden es un backfill aproximado (puede haber empates entre
-- distintos padres nuevos, inofensivo).
INSERT INTO "new_Tarea"
  ("id","parentId","clienteId","color","nombre","descripcion","activo","prioridad","estadoId","horasEstimadas","imprevista","orden","ordenEstado","createdAt")
SELECT
  m."new_id", t."proyectoId", NULL, NULL, t."nombre", t."descripcion", true,
  t."prioridad", t."estadoId", t."horasEstimadas", t."imprevista", t."orden", t."orden", t."createdAt"
FROM "Tarea" t
JOIN "_id_map" m ON m."kind" = 'tarea' AND m."old_id" = t."id";

-- Paso 5: retirar las dos tablas viejas e instalar la unificada con su
-- nombre final antes de reconstruir las tablas que la referencian.
DROP TABLE "Tarea";
DROP TABLE "Proyecto";
ALTER TABLE "new_Tarea" RENAME TO "Tarea";

-- Paso 6: RegistroTiempo con un solo tareaId requerido. "Sin tarea
-- específica" (tareaId null) cae a proyectoId, que ya tiene el id correcto
-- (los ids de Proyecto no cambiaron).
CREATE TABLE "new_RegistroTiempo" (
    "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha"         DATETIME NOT NULL,
    "tareaId"       INTEGER NOT NULL,
    "tipoTrabajoId" INTEGER NOT NULL,
    "horaInicio"    TEXT NOT NULL,
    "horaFin"       TEXT NOT NULL,
    "comentarios"   TEXT,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroTiempo_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegistroTiempo_tipoTrabajoId_fkey" FOREIGN KEY ("tipoTrabajoId") REFERENCES "TipoTrabajo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_RegistroTiempo"
  ("id","fecha","tareaId","tipoTrabajoId","horaInicio","horaFin","comentarios","createdAt")
SELECT
  r."id", r."fecha",
  COALESCE(
    (SELECT m."new_id" FROM "_id_map" m WHERE m."kind" = 'tarea' AND m."old_id" = r."tareaId"),
    r."proyectoId"
  ),
  r."tipoTrabajoId", r."horaInicio", r."horaFin", r."comentarios", r."createdAt"
FROM "RegistroTiempo" r;

DROP TABLE "RegistroTiempo";
ALTER TABLE "new_RegistroTiempo" RENAME TO "RegistroTiempo";

-- Paso 7: mismo colapso para TimerActivo.
CREATE TABLE "new_TimerActivo" (
    "id"            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tareaId"       INTEGER NOT NULL,
    "tipoTrabajoId" INTEGER NOT NULL,
    "inicio"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarios"   TEXT,
    CONSTRAINT "TimerActivo_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TimerActivo_tipoTrabajoId_fkey" FOREIGN KEY ("tipoTrabajoId") REFERENCES "TipoTrabajo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_TimerActivo"
  ("id","tareaId","tipoTrabajoId","inicio","comentarios")
SELECT
  x."id",
  COALESCE(
    (SELECT m."new_id" FROM "_id_map" m WHERE m."kind" = 'tarea' AND m."old_id" = x."tareaId"),
    x."proyectoId"
  ),
  x."tipoTrabajoId", x."inicio", x."comentarios"
FROM "TimerActivo" x;

DROP TABLE "TimerActivo";
ALTER TABLE "new_TimerActivo" RENAME TO "TimerActivo";

-- Paso 8: PlanificacionSemana.tareaId siempre apuntó a una Tarea real (nunca
-- null), es un remapeo puro.
CREATE TABLE "new_PlanificacionSemana" (
    "id"                INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tareaId"           INTEGER NOT NULL,
    "fecha"             DATETIME NOT NULL,
    "horasPlanificadas" REAL,
    "createdAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanificacionSemana_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_PlanificacionSemana"
  ("id","tareaId","fecha","horasPlanificadas","createdAt")
SELECT
  pl."id",
  (SELECT m."new_id" FROM "_id_map" m WHERE m."kind" = 'tarea' AND m."old_id" = pl."tareaId"),
  pl."fecha", pl."horasPlanificadas", pl."createdAt"
FROM "PlanificacionSemana" pl;

DROP TABLE "PlanificacionSemana";
ALTER TABLE "new_PlanificacionSemana" RENAME TO "PlanificacionSemana";

-- Paso 9: descartar la tabla scratch.
DROP TABLE "_id_map";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
