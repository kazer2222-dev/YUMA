-- CreateTable
CREATE TABLE "statuses_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "wipLimit" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "statuses_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old statuses to new statuses (assigning to first board of each space)
INSERT INTO "statuses_new" ("id", "boardId", "name", "key", "color", "description", "order", "isStart", "isDone", "wipLimit", "createdAt", "updatedAt")
SELECT 
    s."id",
    b."id" as "boardId",
    s."name",
    s."key",
    s."color",
    s."description",
    s."order",
    s."isStart",
    s."isDone",
    s."wipLimit",
    s."createdAt",
    s."updatedAt"
FROM "statuses" s
JOIN "boards" b ON b."spaceId" = s."spaceId"
WHERE b."order" = (SELECT MIN("order") FROM "boards" WHERE "spaceId" = s."spaceId");

-- DropTable
DROP TABLE "statuses";

-- RenameTable
ALTER TABLE "statuses_new" RENAME TO "statuses";

-- CreateIndex
CREATE UNIQUE INDEX "statuses_boardId_key_key" ON "statuses"("boardId", "key");














