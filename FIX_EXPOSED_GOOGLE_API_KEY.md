# Fix Exposed Google API Key - Security Alert

## 🚨 Security Issue

GitGuardian detected a Google API Key exposed in your GitHub repository.

**Repository:** kazer2222-dev/YUMA  
**Pushed date:** November 29th 2025, 21:37:35 UTC

## ⚠️ Immediate Actions Required

### Step 1: Revoke the Exposed Key (CRITICAL - Do This First!)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

2. **Find the exposed API key:**
   - Look for the key that was exposed
   - Check the "Last used" date to identify it

3. **Revoke/Delete the key:**
   - Click on the key
   - Click "Delete" or "Revoke"
   - Confirm deletion

4. **Create a new API key:**
   - Click "Create Credentials" → "API Key"
   - Restrict the key (see Step 3 below)
   - Copy the new key

### Step 2: Remove Key from Git History

The key is in your git history. You need to remove it:

**Option A: Use GitHub's Secret Scanning (Recommended)**
1. GitHub may have already detected it
2. Check your repository's Security tab
3. Follow GitHub's recommendations to remove it

**Option B: Rewrite Git History (Advanced)**

⚠️ **WARNING:** Only do this if you haven't shared the repository with others, or coordinate with your team first!

```powershell
# Install git-filter-repo (if not installed)
# pip install git-filter-repo

# Remove the key from all commits
git filter-repo --replace-text <(echo "AIzaYOUR_EXPOSED_KEY==>AIzaREMOVED_KEY")

# Force push (only if you're the only one using the repo)
git push origin --force --all
```

**Option C: Use BFG Repo-Cleaner (Alternative)**

```powershell
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
# Create passwords.txt with: AIzaYOUR_EXPOSED_KEY==>AIzaREMOVED_KEY

java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 3: Secure the New Key

When creating the new API key:

1. **Restrict the key:**
   - Go to the key settings
   - Under "API restrictions", select "Restrict key"
   - Choose only the APIs you need

2. **Set application restrictions:**
   - Under "Application restrictions"
   - Choose "HTTP referrers" for web apps
   - Add your domains: `localhost:3000`, `yourdomain.com`

3. **Save the restrictions**

### Step 4: Update Environment Variables

1. **Add to `.env.local` (local development):**
   ```env
   GOOGLE_API_KEY=AIzaYOUR_NEW_KEY_HERE
   ```

2. **Add to GitHub Secrets (for CI/CD):**
   - Go to: Repository Settings → Secrets and variables → Actions
   - Add: `GOOGLE_API_KEY` with your new key value

3. **Add to Production Environment:**
   - Add to your hosting platform's environment variables
   - Never commit it to Git

### Step 5: Verify No Keys in Code

I've checked your current codebase - no actual Google API keys found in the current files. The key is likely in git history from a previous commit.

**Verify:**
```powershell
# Search for Google API keys in current files
git grep -i "AIza" -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.md" "*.json"
```

## 🔍 Where the Key Might Be

Check these locations:
- ✅ `docs/GOOGLE_OAUTH_SETUP.md` - Only has placeholders (safe)
- ✅ Current code files - No keys found (safe)
- ⚠️ Git history - Key is likely here (needs removal)
- ⚠️ Old commits - Check commit from November 29th, 2025

## 📋 Prevention Checklist

- [ ] ✅ Revoked the exposed key in Google Cloud Console
- [ ] ✅ Created a new restricted API key
- [ ] ✅ Removed key from git history (if possible)
- [ ] ✅ Added new key to `.env.local` (not committed)
- [ ] ✅ Added new key to GitHub Secrets (for CI/CD)
- [ ] ✅ Verified `.env.local` is in `.gitignore` (it is)
- [ ] ✅ Verified no keys in current code files (done)

## 🔐 Best Practices Going Forward

1. **Never commit API keys:**
   - Always use environment variables
   - Keep `.env.local` in `.gitignore` (already done)
   - Use GitHub Secrets for CI/CD

2. **Use placeholders in documentation:**
   - ✅ `GOOGLE_API_KEY=your-google-api-key` (safe)
   - ❌ `GOOGLE_API_KEY=AIza...` (never commit real keys)

3. **Restrict API keys:**
   - Always restrict keys to specific APIs
   - Set application restrictions
   - Rotate keys periodically

4. **Monitor for exposed secrets:**
   - Enable GitHub's secret scanning
   - Use tools like GitGuardian
   - Review commits before pushing

## 🆘 If You Can't Remove from History

If you can't rewrite history (shared repository):

1. **Revoke the key immediately** (most important!)
2. **Create a new key** with restrictions
3. **Accept that the old key is exposed** but revoked
4. **Monitor for unauthorized usage** in Google Cloud Console
5. **Consider the key compromised** and treat it as such

## ✅ Verification

After fixing:

1. **Check Google Cloud Console:**
   - Old key should be deleted/revoked
   - New key should be created and restricted

2. **Check Git:**
   - No keys in current files
   - History cleaned (if possible)

3. **Check Environment:**
   - New key in `.env.local` (not committed)
   - New key in GitHub Secrets (for CI/CD)

---

**Priority:** 🔴 **HIGH** - Revoke the key immediately!

**Status:** Current codebase is clean - key is in git history from previous commit.













