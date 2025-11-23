# Admin User Setup Guide

## Quick Setup (Recommended)

### Option 1: Using Setup API (Easiest - No Server Restart Needed)

If no admin exists yet, create one via API:

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/setup/admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yuma.com", "name": "Admin User"}'
```

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup/admin" -Method POST -ContentType "application/json" -Body '{"email":"admin@yuma.com","name":"Admin User"}'
```

### Option 2: Using Seed Script

**Make sure your dev server is STOPPED first**, then:

```bash
npm run seed:admin
```

Or with custom email:
```bash
ADMIN_EMAIL=your-email@example.com ADMIN_NAME="Your Name" npm run seed:admin
```

### Option 3: Using Prisma Studio

1. Open Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Create a User with email and name
3. Create an AdminRole linked to that user with role: "ADMIN"

## Verifying Admin Access

After logging in, check if you have admin access:

```bash
curl http://localhost:3000/api/admin/create-admin \
  -H "Cookie: accessToken=your-token"
```

This will return:
- `isAdmin: true` if you're an admin
- `isAdmin: false` if you're not

## Admin Features

Admin users can:
- Access `/admin` page
- View platform statistics
- Manage all users
- Manage all spaces
- Create additional admin users
- Access admin API endpoints

## Environment Variables

You can customize the default admin user:

```env
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_NAME=Your Admin Name
```

## Troubleshooting

1. **"No admin user found"**
   - Run `npm run seed:admin` to create one

2. **"Admin access required" error**
   - Make sure you've run the seed script
   - Check that your user has an AdminRole in the database

3. **Can't log in**
   - Check console for PIN (development mode)
   - Make sure email matches exactly
   - PIN expires in 10 minutes

## Security Notes

- Admin users have full platform access
- Only create admin users for trusted individuals
- Consider using environment variables for production admin emails
- Regularly audit admin users and roles
