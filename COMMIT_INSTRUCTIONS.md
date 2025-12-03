# Commit Instructions

Since terminal commands are timing out, please run this PowerShell script to commit and push the changes:

```powershell
.\commit-ci-fix.ps1
```

**Or manually run these commands:**

```powershell
git add .github/workflows/ci.yml
git commit -m "fix: use explicit if/else for CI dependency installation fallback"
git push origin dev
```

## What's Being Committed

- Updated `.github/workflows/ci.yml` with explicit if/else fallback logic
- The workflow will now:
  1. Try `npm ci` first
  2. If it fails, remove the corrupted lock file
  3. Regenerate it with `npm install --legacy-peer-deps`

## Expected Result

After pushing, the CI should:
- Attempt `npm ci` first
- If it fails (due to redux@5.0.1 issue), automatically fall back to `npm install`
- Successfully install dependencies and continue with the pipeline

---

**Run the script or commands above to commit and push the fix.**






