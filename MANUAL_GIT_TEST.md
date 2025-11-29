# Manual Git Connection Test Guide

Since automated scripts are timing out, use these manual steps to test your Git connection.

## ✅ Step 1: Verify Configuration (No Network Required)

Open PowerShell and run these commands one at a time:

```powershell
# Check Git user configuration
git config user.name
# Should show: kazer2222-dev

git config user.email
# Should show: kazer2222@gmail.com

# Check remote URL
git config --get remote.origin.url
# Should show: https://github.com/kazer2222-dev/YUMA.git
```

## 🔧 Step 2: Fix Incomplete Rebase (If Needed)

If you see errors about rebase, run:

```powershell
# Abort incomplete rebase
git rebase --abort

# Or manually remove rebase directory
Remove-Item -Path .git\rebase-merge -Recurse -Force
```

## 🌐 Step 3: Test Network Connectivity

Test if you can reach GitHub:

```powershell
# Test GitHub connectivity
Test-NetConnection github.com -Port 443

# Or simple ping
ping github.com
```

## 🔐 Step 4: Test Git Connection (Requires Authentication)

**Important:** This will prompt for credentials if not already stored.

```powershell
# Test connection (this may prompt for credentials)
git ls-remote origin

# Or simpler test
git fetch origin --dry-run
```

**If it prompts for credentials:**
- Username: `kazer2222-dev`
- Password: Use your Personal Access Token (not GitHub password)

## 📋 Step 5: Check Repository Status

```powershell
# Check current branch
git branch

# Check status
git status

# Check remote branches
git branch -r
```

## 🚨 Troubleshooting

### Issue: "fatal: not a git repository"
**Solution:**
```powershell
git init
```

### Issue: "remote origin already exists"
**Solution:**
```powershell
git remote remove origin
git remote add origin https://github.com/kazer2222-dev/YUMA.git
```

### Issue: "Authentication failed"
**Solution:**
1. Create Personal Access Token: https://github.com/settings/tokens
2. Use token as password when prompted
3. Or update remote URL:
   ```powershell
   git remote set-url origin https://kazer2222-dev:YOUR_TOKEN@github.com/kazer2222-dev/YUMA.git
   ```

### Issue: "Connection timeout"
**Solution:**
- Check internet connection
- Check firewall settings
- Try using SSH instead:
  ```powershell
  git remote set-url origin git@github.com:kazer2222-dev/YUMA.git
  ```

### Issue: "Repository not found"
**Solution:**
- Verify repository exists: https://github.com/kazer2222-dev/YUMA
- Check you have access to the repository
- Create repository on GitHub if it doesn't exist

## ✅ Success Indicators

Your connection is working if:
- ✅ `git config` commands show correct values
- ✅ `git ls-remote origin` shows branch information
- ✅ `git fetch origin` completes without errors
- ✅ `git status` shows clean repository state

## 📝 Quick Test Checklist

Run these commands in order:

```powershell
# 1. Verify config (should work immediately)
git config user.name
git config user.email
git config --get remote.origin.url

# 2. Check repository state
git status

# 3. Test connection (may prompt for credentials)
git ls-remote origin

# 4. If successful, try fetching
git fetch origin
```

## 🎯 Expected Results

**If everything is configured correctly:**
- Config commands return: `kazer2222-dev`, `kazer2222@gmail.com`, `https://github.com/kazer2222-dev/YUMA.git`
- `git ls-remote origin` shows list of branches
- `git fetch origin` completes successfully

**If you see errors:**
- Follow the troubleshooting steps above
- Check the specific error message
- Verify your Personal Access Token is valid

---

**Note:** If commands still hang or timeout, there may be a network or firewall issue preventing Git from connecting to GitHub. In that case, check your network settings or try from a different network.

