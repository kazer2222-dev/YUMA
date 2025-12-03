# Create 3-Branch Strategy - Quick Guide

## 🚀 Quick Setup

### Option 1: Run the Script (Easiest)

```powershell
.\setup-branches.ps1
```

This script will:
- Create `dev`, `stage`, and `production` branches
- Push them to GitHub
- Set up branch tracking

### Option 2: Manual Setup

Run these commands in PowerShell:

```powershell
# Make sure you're on main branch
git checkout main
git pull origin main

# Create and push dev branch
git checkout -b dev
git push -u origin dev

# Create and push stage branch
git checkout -b stage
git push -u origin stage

# Create and push production branch
git checkout -b production
git push -u origin production

# Switch back to main
git checkout main
```

## ✅ Verification

After creating branches, verify they exist:

```powershell
# List all branches
git branch -a

# Should show:
# * main
#   dev
#   stage
#   production
```

## 🔄 Branch Workflow

### Development Flow

```
main → dev → stage → production
```

1. **Work on `dev` branch:**
   ```powershell
   git checkout dev
   # Make changes
   git add .
   git commit -m "feat: your changes"
   git push origin dev
   ```

2. **Deploy to staging:**
   ```powershell
   git checkout stage
   git merge dev
   git push origin stage
   ```

3. **Deploy to production:**
   ```powershell
   git checkout production
   git merge stage
   git push origin production
   ```

## 📋 Branch Configuration

I've updated `.git/config` to track all branches:
- ✅ `main` - Main branch
- ✅ `dev` - Development branch
- ✅ `stage` - Staging branch
- ✅ `production` - Production branch

## 🎯 Next Steps

1. **Create the branches** (use script or manual commands above)
2. **Set up branch protection** in GitHub (recommended):
   - Go to: Repository Settings → Branches
   - Add rules for `main`, `stage`, and `production`
3. **Verify workflows** are configured for each branch

---

**Ready to create branches?** Run `.\setup-branches.ps1` or use the manual commands above.








