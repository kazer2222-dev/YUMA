# How to Cancel and Recommit

## 🔄 Cancel Last Commit (Keep Changes)

If you want to undo the last commit but keep your changes:

```powershell
# Undo the last commit, keep changes staged
git reset --soft HEAD~1

# Or undo the last commit, unstage changes (keep files modified)
git reset HEAD~1
```

## 📋 Step-by-Step Guide

### Option 1: Cancel Commit, Keep Changes Staged

```powershell
# 1. Cancel the last commit (changes stay staged)
git reset --soft HEAD~1

# 2. Check status - files should still be staged
git status

# 3. Make any changes if needed
# (edit files, add more files, etc.)

# 4. Recommit with new message
git commit -m "Your new commit message"
```

### Option 2: Cancel Commit, Unstage Changes

```powershell
# 1. Cancel the last commit (changes become unstaged)
git reset HEAD~1

# 2. Check status - files should be modified but not staged
git status

# 3. Stage files again
git add .

# 4. Recommit with new message
git commit -m "Your new commit message"
```

### Option 3: Cancel Commit, Discard Changes (⚠️ Careful!)

```powershell
# ⚠️ WARNING: This will DELETE your changes!
git reset --hard HEAD~1
```

## 🎯 Common Scenarios

### Scenario 1: Fix Commit Message

```powershell
# Cancel last commit, keep changes
git reset --soft HEAD~1

# Recommit with better message
git commit -m "fix: remove hardcoded JWT secret to prevent GitHub push protection"
```

### Scenario 2: Add More Files to Commit

```powershell
# Cancel last commit
git reset --soft HEAD~1

# Add more files
git add other-file.ts

# Recommit with all files
git commit -m "fix: remove hardcoded JWT secret and update related files"
```

### Scenario 3: Split One Commit into Multiple

```powershell
# Cancel last commit, unstage changes
git reset HEAD~1

# Stage and commit first set of changes
git add lib/auth.ts
git commit -m "fix: remove hardcoded JWT secret"

# Stage and commit second set of changes
git add other-file.ts
git commit -m "feat: add new feature"
```

## 📝 Quick Reference

| Command | What It Does |
|---------|-------------|
| `git reset --soft HEAD~1` | Cancel commit, keep changes **staged** |
| `git reset HEAD~1` | Cancel commit, keep changes **unstaged** |
| `git reset --hard HEAD~1` | Cancel commit, **delete changes** ⚠️ |

## ✅ Recommended Steps for Your Situation

Since you need to fix the commit before pushing:

```powershell
# 1. Cancel the last commit (keep changes staged)
git reset --soft HEAD~1

# 2. Verify the fix is still there
git status

# 3. Recommit with proper message
git commit -m "fix: remove hardcoded JWT secret to prevent GitHub push protection"

# 4. Push after unblocking
git push origin main
```

## 🔍 Check What You're Canceling

Before canceling, you can see what the last commit contains:

```powershell
# See last commit details
git show HEAD

# See commit message
git log -1

# See what files were changed
git show --name-only HEAD
```

## ⚠️ Important Notes

- **If you already pushed:** You'll need to force push after canceling (not recommended if others are using the repo)
- **If you haven't pushed:** Safe to cancel and recommit
- **Always check status:** Use `git status` to see what state your files are in

---

**For your current situation:**
1. Cancel commit: `git reset --soft HEAD~1`
2. Recommit: `git commit -m "fix: remove hardcoded JWT secret to prevent GitHub push protection"`
3. Push: `git push origin main` (after unblocking)








