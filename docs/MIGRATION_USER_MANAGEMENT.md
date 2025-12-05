# Space User Management Migration Guide

## Overview
This migration introduces a comprehensive role-based permission system to replace the simple string-based roles in `SpaceMember`.

## Migration Steps

### Step 1: Backup Database
```bash
# Create backup before migration
cp prisma/dev.db prisma/dev.db.backup
```

### Step 2: Run TypeScript Migration Script
This script will:
- Create default roles (Admin, Member, Viewer) for each space
- Assign permissions to each role
- Map existing member role strings to new role IDs

```bash
npx ts-node scripts/migrate-user-management.ts
```

### Step 3: Apply Schema Changes
After the TypeScript script completes, apply the final schema changes:

```sql
-- Rename temp column to permanent
ALTER TABLE space_members DROP COLUMN role;
ALTER TABLE space_members RENAME COLUMN roleId_temp TO roleId;

-- Add foreign key constraint
-- Note: SQLite doesn't support adding FK after table creation,
-- so this will need to be done through Prisma migrate
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Verify Migration
Run verification script:
```bash
npx ts-node scripts/verify-user-management.ts
```

## Rollback Plan
If migration fails:
```bash
# Restore from backup
cp prisma/dev.db.backup prisma/dev.db

# Regenerate client
npx prisma generate
```

## Alternative: Fresh Start (Development Only)
For development environments, you can reset:
```bash
npx prisma migrate reset
# Then run seed scripts to recreate data
```

## Notes
- **Production**: This migration requires careful planning due to breaking changes
- **Testing**: Thoroughly test in staging before production
- **Downtime**: May require brief downtime during migration
