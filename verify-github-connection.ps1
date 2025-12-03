# GitHub Connection Verification and Setup Script
# Run this script in PowerShell to verify and fix your GitHub connection

Write-Host "=== GitHub Connection Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check if .git directory exists
if (Test-Path .git) {
    Write-Host "✓ Git repository found" -ForegroundColor Green
} else {
    Write-Host "✗ Git repository not found. Run: git init" -ForegroundColor Red
    exit 1
}

# Check Git configuration
Write-Host ""
Write-Host "Checking Git configuration..." -ForegroundColor Yellow

$userName = git config user.name
$userEmail = git config user.email
$remoteUrl = git config --get remote.origin.url

if ($userName) {
    Write-Host "✓ User name: $userName" -ForegroundColor Green
} else {
    Write-Host "✗ User name not set. Run: git config user.name 'kazer2222-dev'" -ForegroundColor Red
}

if ($userEmail) {
    Write-Host "✓ User email: $userEmail" -ForegroundColor Green
} else {
    Write-Host "✗ User email not set. Run: git config user.email 'kazer2222@gmail.com'" -ForegroundColor Red
}

if ($remoteUrl) {
    Write-Host "✓ Remote URL: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "✗ Remote URL not set. Run: git remote add origin https://github.com/kazer2222-dev/YUMA.git" -ForegroundColor Red
}

# Check for incomplete rebase
if (Test-Path .git/rebase-merge) {
    Write-Host ""
    Write-Host "⚠ WARNING: Incomplete rebase detected!" -ForegroundColor Yellow
    Write-Host "This may cause Git commands to hang or fail." -ForegroundColor Yellow
    Write-Host ""
    $abort = Read-Host "Do you want to abort the rebase? (y/n)"
    if ($abort -eq 'y' -or $abort -eq 'Y') {
        git rebase --abort
        Write-Host "✓ Rebase aborted" -ForegroundColor Green
    }
}

# Test connection
Write-Host ""
Write-Host "Testing GitHub connection..." -ForegroundColor Yellow
Write-Host "This may prompt for credentials..." -ForegroundColor Gray

try {
    $result = git ls-remote origin --heads 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available branches:" -ForegroundColor Cyan
        $result | Select-String "refs/heads" | ForEach-Object {
            $branch = ($_ -split "refs/heads/")[1]
            Write-Host "  - $branch" -ForegroundColor White
        }
    } else {
        Write-Host "✗ Connection failed" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "1. Authentication required - Set up Personal Access Token or SSH key" -ForegroundColor White
        Write-Host "2. Repository doesn't exist - Create it on GitHub first" -ForegroundColor White
        Write-Host "3. Network connectivity - Check your internet connection" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Error testing connection: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If connection failed, set up authentication (see GITHUB_CONNECTION_SETUP.md)" -ForegroundColor White
Write-Host "2. Push your code: git push -u origin main" -ForegroundColor White
Write-Host ""







