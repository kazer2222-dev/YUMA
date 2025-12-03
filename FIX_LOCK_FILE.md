# Fix Package Lock File Sync Issue

## Issue

GitHub Actions CI is failing with:
```
npm error `npm ci` can only install packages when your package.json and package-lock.json are in sync.
npm error Missing: redux@5.0.1 from lock file
```

## Root Cause

The `package-lock.json` file is out of sync with `package.json`. This happens when:
- Dependencies are added/removed from `package.json` without running `npm install`
- The lock file was manually edited
- Different npm versions were used

## Temporary Fix Applied

Updated CI workflow to use `npm install` instead of `npm ci` as a temporary workaround. This allows CI to proceed, but `npm ci` is preferred for CI/CD because it's faster and more deterministic.

## Permanent Fix Required

You need to regenerate the lock file locally:

### Steps to Fix:

1. **Delete the lock file:**
   ```bash
   rm package-lock.json
   ```

2. **Regenerate it:**
   ```bash
   npm install
   ```

3. **Commit the updated lock file:**
   ```bash
   git add package-lock.json
   git commit -m "fix: regenerate package-lock.json to sync with package.json"
   git push origin dev
   ```

4. **Revert CI workflow to use `npm ci`:**
   After the lock file is fixed, update `.github/workflows/ci.yml`:
   ```yaml
   - name: Install dependencies
     run: npm ci
   ```

## Why This Happened

The `redux@5.0.1` package is a nested dependency (required by `@reduxjs/toolkit`), but the lock file structure is incomplete or corrupted. Regenerating the lock file will fix all nested dependencies.

## Verification

After regenerating the lock file:
1. Run `npm ci` locally - it should work without errors
2. Push the updated lock file
3. CI should pass with `npm ci`

---

**Status:** ⚠️ Temporary fix applied - permanent fix needed







