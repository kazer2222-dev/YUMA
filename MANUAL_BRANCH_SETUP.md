# Manual Branch Setup Guide

Since automated scripts may have issues, here's a simple manual process to complete the branch setup.

## ✅ What's Already Done

- ✅ Git repository configured
- ✅ Remote set to: `https://github.com/kazer2222-dev/YUMA.git`
- ✅ Branch tracking configured in `.git/config`
- ✅ All workflow files created
- ✅ PowerShell scripts fixed (no more emoji syntax errors)

## 🚀 Manual Steps

### Step 1: Check Current Status

Open PowerShell and run:

```powershell
# Check current branch
git branch --show-current

# List all local branches
git branch

# List all remote branches
git branch -r
```

### Step 2: Create/Push Dev Branch

```powershell
# If dev branch exists locally, just push it
git checkout dev
git push -u origin dev

# If dev branch doesn't exist, create it
git checkout main
git checkout -b dev
git push -u origin dev
```

### Step 3: Create/Push Stage Branch

```powershell
# Create from main
git checkout main
git checkout -b stage
git push -u origin stage
```

### Step 4: Create/Push Production Branch

```powershell
# Create from main
git checkout main
git checkout -b production
git push -u origin production
```

### Step 5: Return to Main

```powershell
git checkout main
```

### Step 6: Verify on GitHub

1. Visit: https://github.com/kazer2222-dev/YUMA/branches
2. You should see all 4 branches: `main`, `dev`, `stage`, `production`

## 🔧 Alternative: Use the Fixed Scripts

The scripts have been fixed and should work now:

```powershell
# Verify current status
.\verify-branch-setup.ps1

# Complete branch setup
.\complete-branch-setup.ps1
```

## 📋 Quick Command Reference

```powershell
# Switch branches
git checkout dev
git checkout stage
git checkout production
git checkout main

# Push a branch (first time)
git push -u origin branch-name

# Update a branch
git pull origin branch-name

# View all branches
git branch -a
```

## ⚠️ If You Get Authentication Errors

1. **Use Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Create a new token with `repo` permissions
   - Use it as password when pushing

2. **Or use SSH:**
   - Set up SSH keys in GitHub
   - Change remote URL: `git remote set-url origin git@github.com:kazer2222-dev/YUMA.git`

## ✅ Verification Checklist

After completing the steps:

- [ ] All 4 branches exist locally (`main`, `dev`, `stage`, `production`)
- [ ] All 4 branches exist on GitHub
- [ ] You can switch between branches
- [ ] You can push to each branch

---

**Need Help?** Check `NEXT_STEPS.md` for detailed instructions.








