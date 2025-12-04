# Fix and commit all changes
Write-Host "=== Fixing and Committing All Changes ===" -ForegroundColor Cyan
Write-Host ""

# Add all modified files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .github/workflows/ci.yml
git add jest.config.js
git add jest.setup.js
git add __tests__/api.test.ts
git add package-lock.json

# Check status
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "fix: update CI workflow fallback, fix Jest tests, and update lock file

- Add explicit if/else fallback in CI workflow for npm ci failures
- Add fetch polyfill for Jest tests
- Exclude e2e tests from Jest (should only run with Playwright)
- Fix API test to properly mock fetch
- Update package-lock.json with redux@5.0.1 entry"

# Push
Write-Host ""
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "CI should now pass with the fallback mechanism." -ForegroundColor Green











