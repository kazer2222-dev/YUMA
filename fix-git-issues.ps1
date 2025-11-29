# Git Issues Fix Script
# This script fixes common Git issues that can cause commands to hang

Write-Host "=== Git Issues Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Fix 1: Abort incomplete rebase
if (Test-Path .git/rebase-merge) {
    Write-Host "Fixing: Incomplete rebase detected" -ForegroundColor Yellow
    git rebase --abort 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Rebase aborted successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not abort rebase automatically" -ForegroundColor Yellow
        Write-Host "  You may need to manually remove .git/rebase-merge directory" -ForegroundColor Gray
    }
}

# Fix 2: Abort incomplete merge
if (Test-Path .git/MERGE_HEAD) {
    Write-Host "Fixing: Incomplete merge detected" -ForegroundColor Yellow
    git merge --abort 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Merge aborted successfully" -ForegroundColor Green
    }
}

# Fix 3: Clean up lock files
$lockFiles = @(".git/index.lock", ".git/refs/heads/*.lock", ".git/config.lock")
foreach ($lockFile in $lockFiles) {
    $files = Get-ChildItem -Path $lockFile -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Write-Host "Removing lock file: $($file.FullName)" -ForegroundColor Yellow
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Lock file removed" -ForegroundColor Green
    }
}

# Fix 4: Verify Git configuration
Write-Host ""
Write-Host "Verifying Git configuration..." -ForegroundColor Yellow

if (-not (git config user.name)) {
    Write-Host "Setting user.name..." -ForegroundColor Yellow
    git config user.name "kazer2222-dev"
    Write-Host "✓ User name set" -ForegroundColor Green
}

if (-not (git config user.email)) {
    Write-Host "Setting user.email..." -ForegroundColor Yellow
    git config user.email "kazer2222@gmail.com"
    Write-Host "✓ User email set" -ForegroundColor Green
}

if (-not (git config --get remote.origin.url)) {
    Write-Host "Setting remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/kazer2222-dev/YUMA.git 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Remote origin set" -ForegroundColor Green
    } else {
        Write-Host "⚠ Remote may already exist, updating..." -ForegroundColor Yellow
        git remote set-url origin https://github.com/kazer2222-dev/YUMA.git
        Write-Host "✓ Remote URL updated" -ForegroundColor Green
    }
}

# Fix 5: Set credential helper
Write-Host "Setting credential helper..." -ForegroundColor Yellow
git config credential.helper manager-core
Write-Host "✓ Credential helper set" -ForegroundColor Green

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  User: $(git config user.name)" -ForegroundColor White
Write-Host "  Email: $(git config user.email)" -ForegroundColor White
Write-Host "  Remote: $(git config --get remote.origin.url)" -ForegroundColor White
Write-Host ""
Write-Host "Next: Run verify-github-connection.ps1 to test the connection" -ForegroundColor Cyan
Write-Host ""

