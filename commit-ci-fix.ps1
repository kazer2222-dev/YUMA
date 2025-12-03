# Commit and push CI workflow fix
Write-Host "Committing CI workflow fix..." -ForegroundColor Cyan

git add .github/workflows/ci.yml
git commit -m "fix: use explicit if/else for CI dependency installation fallback"
git push origin dev

Write-Host "Done!" -ForegroundColor Green








