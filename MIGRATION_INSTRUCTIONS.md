# Database Migration Instructions

## ⚠️ IMPORTANT: Fix for 500 Error When Creating Documents

If you're getting a **500 Internal Server Error** when trying to create documents, it's most likely because the database tables don't exist yet. Follow the steps below to fix this.

## Document Management Module Migration

The Document Management module requires database schema changes. Follow these steps to apply the migrations:

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

### Step 2: Apply Database Migrations

You have two options:

#### Option A: Create a Migration (Recommended for Production)

```bash
npx prisma migrate dev --name add_document_management
```

This will:
- Create a migration file
- Apply the migration to your database
- Regenerate Prisma Client

#### Option B: Push Schema Directly (Faster for Development)

```bash
npx prisma db push
```

This will:
- Push schema changes directly to the database
- Regenerate Prisma Client
- **Note**: This doesn't create migration files, so use only in development

### Step 3: Verify Migration

After migration, verify the tables were created:

```bash
npx prisma studio
```

Or check your database directly - you should see these new tables:
- `documents`
- `document_versions`
- `document_access`
- `document_comments`
- `document_activities`
- `document_share_links`
- `document_links`
- `document_vectors`
- `document_redactions`

### Troubleshooting

If you encounter errors:

1. **"Table already exists"**: The migration may have partially run. Check your database and manually clean up if needed.

2. **"Foreign key constraint"**: Make sure all related tables (User, Space) exist first.

3. **"EPERM" error on Windows**: 
   - Close any applications using the database
   - Stop the dev server
   - Try running the command again

4. **SQLite lock errors**:
   - Close Prisma Studio if open
   - Stop the dev server
   - Try again

### After Migration

Once the migration is complete, restart your development server:

```bash
npm run dev
```

The Document Management module should now work correctly!

## What Was Fixed

1. **Improved Error Logging**: Added detailed error logging to help diagnose issues
2. **Next.js 14+ Compatibility**: Updated all document API routes to handle params as potentially being a Promise
3. **SQLite Compatibility**: Removed `mode: 'insensitive'` from queries (SQLite doesn't support it)
4. **Helper Function**: Created `resolveParams` helper for consistent param handling across routes
