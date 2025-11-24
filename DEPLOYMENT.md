# Production Deployment Guide

## 🔒 Environment Variables in Production

**IMPORTANT:** Never upload `.env` files to production servers! Instead, use your hosting platform's environment variable management system.

## 📋 Required Environment Variables

Based on your `env.example`, you'll need to set these in production:

### Required Variables
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database Configuration (use production database URL)
DATABASE_URL=postgresql://user:password@host:5432/database
# OR for MySQL: mysql://user:password@host:3306/database
# OR for SQLite: file:./prisma/prod.db

# Session Secret (generate a strong random string)
SESSION_SECRET=your-strong-random-session-secret-here

# Application URL
NEXTAUTH_URL=https://your-domain.com
```

### Optional Variables
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@your-domain.com

# Admin Configuration
ADMIN_EMAIL=admin@your-domain.com
ADMIN_NAME=Admin User
```

## 🚀 Platform-Specific Instructions

### Vercel (Recommended for Next.js)

1. **Deploy your repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Set Environment Variables:**
   - Go to your project dashboard
   - Click **Settings** → **Environment Variables**
   - Add each variable:
     - **Name:** `OPENAI_API_KEY`
     - **Value:** `sk-your-key-here`
     - **Environment:** Production, Preview, Development (select all)
   - Repeat for all variables

3. **Redeploy:**
   - After adding variables, trigger a new deployment
   - Variables are automatically injected at build/runtime

**Vercel CLI Alternative:**
```bash
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
# ... etc
```

### Railway

1. **Deploy:**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo

2. **Set Environment Variables:**
   - Click on your project
   - Go to **Variables** tab
   - Click **+ New Variable**
   - Add each variable with name and value
   - Variables are automatically available

**Railway CLI:**
```bash
railway variables set OPENAI_API_KEY=sk-your-key-here
railway variables set DATABASE_URL=postgresql://...
```

### AWS (Elastic Beanstalk / EC2)

1. **Using AWS Console:**
   - Go to Elastic Beanstalk → Your Environment → Configuration
   - Click **Software** → **Environment properties**
   - Add each variable

2. **Using EB CLI:**
```bash
eb setenv OPENAI_API_KEY=sk-your-key-here \
          DATABASE_URL=postgresql://... \
          SESSION_SECRET=your-secret
```

3. **Using EC2 directly:**
   - SSH into your instance
   - Create `/etc/environment` or use systemd service files
   - Or use AWS Systems Manager Parameter Store

### Google Cloud Platform (Cloud Run / App Engine)

1. **Cloud Run:**
   - Go to Cloud Run → Your Service → Edit & Deploy New Revision
   - Under **Variables & Secrets**, add environment variables
   - Or use Secret Manager for sensitive values

2. **App Engine:**
   - Create `app.yaml`:
   ```yaml
   env_variables:
     OPENAI_API_KEY: 'sk-your-key-here'
     DATABASE_URL: 'postgresql://...'
   ```
   - Or use Secret Manager

### DigitalOcean App Platform

1. **Deploy:**
   - Go to DigitalOcean → Apps → Create App
   - Connect your GitHub repository

2. **Set Environment Variables:**
   - In app settings, go to **App-Level Environment Variables**
   - Add each variable
   - Or use **Component-Level** for specific services

### Render

1. **Deploy:**
   - Go to [render.com](https://render.com)
   - Create new Web Service from GitHub repo

2. **Set Environment Variables:**
   - In your service dashboard, go to **Environment**
   - Add each variable
   - Click **Save Changes**

### Heroku

1. **Using Heroku CLI:**
```bash
heroku config:set OPENAI_API_KEY=sk-your-key-here
heroku config:set DATABASE_URL=postgresql://...
heroku config:set SESSION_SECRET=your-secret
```

2. **Using Dashboard:**
   - Go to your app → Settings → Config Vars
   - Click **Reveal Config Vars**
   - Add each variable

### Docker / Self-Hosted

1. **Using docker-compose.yml:**
```yaml
services:
  app:
    image: your-app
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
    env_file:
      - .env.production  # Only if you must use file (not recommended)
```

2. **Using .env file (if necessary):**
   - Create `.env.production` on server (NOT in git)
   - Set file permissions: `chmod 600 .env.production`
   - Load with: `export $(cat .env.production | xargs)`

3. **Using systemd service:**
```ini
[Service]
Environment="OPENAI_API_KEY=sk-your-key-here"
Environment="DATABASE_URL=postgresql://..."
Environment="SESSION_SECRET=your-secret"
```

## 🔐 Security Best Practices

### 1. Use Secret Management Services
- **AWS:** Systems Manager Parameter Store / Secrets Manager
- **GCP:** Secret Manager
- **Azure:** Key Vault
- **HashiCorp:** Vault

### 2. Rotate Secrets Regularly
- Change API keys every 90 days
- Update session secrets periodically
- Use different keys for dev/staging/production

### 3. Limit Access
- Only give access to necessary team members
- Use read-only access when possible
- Audit who has access to secrets

### 4. Never Commit Secrets
- Double-check `.gitignore` includes `.env*`
- Use pre-commit hooks to prevent accidental commits
- Scan repository history if secrets were committed

### 5. Use Different Values Per Environment
- Development: Local `.env` file
- Staging: Staging environment variables
- Production: Production environment variables

## 📝 Pre-Deployment Checklist

- [ ] All required environment variables are set in production
- [ ] Database URL points to production database
- [ ] Session secret is strong and unique
- [ ] API keys are production keys (not development)
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] Email configuration is set up (if using)
- [ ] Admin user can be created (if needed)
- [ ] `.env` files are NOT in repository
- [ ] `.gitignore` includes `.env*` patterns

## 🧪 Testing Environment Variables

After deployment, verify variables are loaded:

1. **Check via API:**
   ```bash
   curl https://your-domain.com/api/test-env
   ```

2. **Check in application:**
   - Try using features that require API keys
   - Check database connectivity
   - Verify authentication works

## 🔄 Updating Environment Variables

1. **Update in platform dashboard**
2. **Redeploy application** (most platforms auto-redeploy)
3. **Verify changes** are applied
4. **Test functionality** to ensure nothing broke

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [12-Factor App: Config](https://12factor.net/config)

## 🆘 Troubleshooting

### Variables Not Loading
- Check variable names match exactly (case-sensitive)
- Verify environment scope (production vs preview)
- Restart/redeploy application
- Check platform logs for errors

### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check database is accessible from hosting platform
- Verify firewall/network rules allow connections
- Test connection string locally first

### API Keys Not Working
- Verify keys are active and not expired
- Check API key permissions/scopes
- Verify no extra spaces in variable values
- Check rate limits haven't been exceeded

