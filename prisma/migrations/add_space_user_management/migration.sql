-- CreateTable: Add new user management tables
CREATE TABLE "space_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "space_roles_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "space_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "space_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "space_roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "space_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
   "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    CONSTRAINT "space_invitations_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "space_invitations_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "space_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "space_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "space_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "space_audit_logs_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "space_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX "space_roles_spaceId_name_key" ON "space_roles"("spaceId", "name");
CREATE UNIQUE INDEX "space_permissions_roleId_permissionKey_key" ON "space_permissions"("roleId", "permissionKey");
CREATE UNIQUE INDEX "space_invitations_token_key" ON "space_invitations"("token");

-- Step 1: Add temporary columns to space_members
ALTER TABLE "space_members" ADD COLUMN "roleId_temp" TEXT;
ALTER TABLE "space_members" ADD COLUMN "addedBy" TEXT;
ALTER TABLE "space_members" RENAME COLUMN "joinedAt" TO "addedAt";

-- Step 2: For each space, create default roles
-- This will be done via a migration script
