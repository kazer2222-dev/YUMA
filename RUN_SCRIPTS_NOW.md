# How to Run the Fixed Scripts

## Quick Start

Open PowerShell in your project directory and run these commands:

### Step 1: Verify Current Status

```powershell
.\verify-branch-setup.ps1
```

This will show you:
- Current Git repository status
- Which branches exist locally
- Which branches exist on GitHub
- What needs to be done

### Step 2: Complete Branch Setup

```powershell
.\complete-branch-setup.ps1
```

This will:
- Create any missing branches
- Push branches to GitHub
- Set up branch tracking
- Show a summary

## If You Get Execution Policy Errors

If PowerShell blocks the script, run this first:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try running the scripts again.

## Alternative: Run with Bypass

```powershell
powershell -ExecutionPolicy Bypass -File .\verify-branch-setup.ps1
powershell -ExecutionPolicy Bypass -File .\complete-branch-setup.ps1
```

## Expected Output

### Verification Script Output:
```
=== Verifying 3-Branch Strategy Setup ===

Checking remote configuration...
  [OK] Remote URL: https://github.com/kazer2222-dev/YUMA.git
  [OK] Correct repository

Checking branches...
  [OK] main
    Local: [OK]
    Remote: [OK]
  [WARN] dev
    Local: [OK]
    Remote: [X]
  ...

=== Summary ===
[WARN] Some branches need attention

Run the setup script to fix:
  .\complete-branch-setup.ps1
```

### Setup Script Output:
```
=== Completing 3-Branch Strategy Setup ===

Current branch: main

Processing branch: dev
  [OK] Local branch exists
  [OK] Checked out dev
  -> Pushing to remote...
  [OK] Pushed dev to remote

...

=== Setup Summary ===
Branch Status:
  -> * main
  [OK] remotes/origin/main
  [OK] remotes/origin/dev
  ...
```

## Troubleshooting

### If Scripts Don't Run:
1. Make sure you're in the project directory
2. Check that the files exist: `ls *.ps1`
3. Try running with full path: `powershell -File "C:\Users\User\Desktop\task management project\verify-branch-setup.ps1"`

### If Git Commands Fail:
- Check your Git authentication
- Make sure you have a Personal Access Token set up
- Verify the remote URL: `git remote -v`

## Next Steps After Running Scripts

1. Verify branches on GitHub: https://github.com/kazer2222-dev/YUMA/branches
2. Set up branch protection rules
3. Configure GitHub Secrets
4. Test deployment workflows

---

**Ready to go!** Open PowerShell and run the scripts now.













