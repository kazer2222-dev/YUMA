# Quick Fix: JWT_SECRET Error

## 🚨 Error
```
Error: JWT_SECRET environment variable is required. Please set it in your .env file.
```

## ✅ Quick Fix

### Step 1: Create `.env.local` file

**Option A: Run the script (Easiest)**
```powershell
.\create-env-file.ps1
```

**Option B: Create manually**
1. Create a file named `.env.local` in the project root
2. Add this content:

```env
# JWT Secret - Required for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string

# Database URL
DATABASE_URL=file:./prisma/dev.db

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string
NEXTAUTH_URL=http://localhost:3000
```

### Step 2: Generate a Secure Secret

**Using Node.js:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Step 3: Update `.env.local`

1. Open `.env.local`
2. Replace `your-super-secret-jwt-key-change-this-in-production-use-random-string` with your generated secret
3. Save the file

### Step 4: Restart Server

```powershell
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Done!

The error should be resolved. The application will now start successfully.

## 📝 Notes

- `.env.local` is already in `.gitignore` (won't be committed)
- Use a different secret for production
- Keep your secret secure and never commit it to Git













