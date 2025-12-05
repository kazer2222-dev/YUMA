# Environment Setup - Quick Fix

## 🚨 Error
```
Error: JWT_SECRET environment variable is required.
```

## ✅ Solution

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the project root with this content:

```env
JWT_SECRET=temp-jwt-secret-for-development-change-in-production
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=temp-jwt-secret-for-development-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

### Step 2: Restart Development Server

After creating the file, restart your server:

```powershell
# Stop the server (Ctrl+C if running)
npm run dev
```

## 🔐 Generate a Secure Secret (Recommended)

For production, generate a secure random secret:

**Using Node.js:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Then replace `temp-jwt-secret-for-development-change-in-production` in `.env.local` with the generated value.

## 📝 Quick Copy-Paste

Copy this into `.env.local`:

```env
JWT_SECRET=temp-jwt-secret-for-development-change-in-production
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=temp-jwt-secret-for-development-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

## ✅ That's It!

After creating `.env.local` and restarting the server, the error will be resolved.













