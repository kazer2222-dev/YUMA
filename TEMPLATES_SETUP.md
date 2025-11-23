# Templates Feature Setup

## Database Migration

The templates table has been added to the Prisma schema. To complete the setup:

### Step 1: Stop the dev server (if running)
The Prisma client generation needs the dev server to be stopped to avoid file lock issues on Windows.

### Step 2: Run database migration
```bash
npx prisma db push
```

This will:
- Create the `templates` table in your database
- Sync the schema with the database

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

This will:
- Generate TypeScript types for the Template model
- Update the Prisma client with template methods

### Step 4: Restart dev server
After generating the client, restart your Next.js dev server:
```bash
npm run dev
```

## Verification

After setup, you should be able to:
1. Navigate to Space → Overview → Space Settings → Templates
2. Create a new template
3. Use templates in the Create Task dialog

## Troubleshooting

If you see "Failed to create template" error:
1. Check if the database migration ran: `npx prisma db push`
2. Check if Prisma client was generated: `npx prisma generate`
3. Restart the dev server
4. Check server logs for detailed error messages (now includes better error logging)

## Error Details

The API now includes detailed error logging. Check the server console for:
- Database connection errors
- Table not found errors (migration not run)
- Validation errors
- Unique constraint violations


























