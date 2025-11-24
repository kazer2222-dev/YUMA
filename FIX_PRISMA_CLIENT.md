# Fix: "Cannot read properties of undefined (reading 'create')" Error

## 🔴 The Problem

The error `Cannot read properties of undefined (reading 'create')` means the Prisma client hasn't been regenerated after adding the Document model to the schema. The dev server is still using the old Prisma client that doesn't know about the Document model.

## ✅ The Solution

You need to **stop the dev server**, regenerate the Prisma client, and then restart it.

### Step-by-Step Fix

1. **Stop the Dev Server**
   - Go to the terminal where `npm run dev` is running
   - Press `Ctrl+C` to stop it
   - Wait for it to fully stop

2. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```
   
   This will regenerate the Prisma client with all the new Document models.

3. **Restart the Dev Server**
   ```bash
   npm run dev
   ```

4. **Try Creating a Document Again**
   - The error should now be resolved
   - Document creation should work

## 🔍 Why This Happened

1. We added new models (Document, DocumentVersion, etc.) to `prisma/schema.prisma`
2. We ran `npx prisma db push` to create the database tables ✅
3. But the Prisma client TypeScript types and runtime code weren't regenerated ❌
4. The dev server was still running with the old client that doesn't have the Document model

## 🐛 If You Still Get Errors

If `npx prisma generate` fails with an EPERM error:

1. **Make sure the dev server is completely stopped**
   - Check Task Manager for any Node.js processes
   - Kill them if needed

2. **Close any other applications using the database**
   - Close Prisma Studio if open
   - Close any database viewers

3. **Try again:**
   ```bash
   npx prisma generate
   ```

4. **If it still fails, try deleting the Prisma client and regenerating:**
   ```bash
   # Delete the generated client
   Remove-Item -Recurse -Force node_modules\.prisma
   
   # Regenerate
   npx prisma generate
   ```

## ✅ Success Indicators

After regenerating and restarting:
- No errors in the terminal when starting the dev server
- Document creation works without errors
- You can see documents in the list
- No "Cannot read properties of undefined" errors


