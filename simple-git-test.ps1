# Simple Git Connection Test
# This script uses minimal commands to avoid timeouts

Write-Host "=== Simple Git Connection Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Git is installed
Write-Host "Test 1: Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error checking Git: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check Git configuration (no network required)
Write-Host "Test 2: Checking Git configuration..." -ForegroundColor Yellow

$userName = git config user.name 2>&1
$userEmail = git config user.email 2>&1
$remoteUrl = git config --get remote.origin.url 2>&1

if ($userName -and $userName -notmatch "error") {
    Write-Host "✓ User name: $userName" -ForegroundColor Green
} else {
    Write-Host "✗ User name not set" -ForegroundColor Red
}

if ($userEmail -and $userEmail -notmatch "error") {
    Write-Host "✓ User email: $userEmail" -ForegroundColor Green
} else {
    Write-Host "✗ User email not set" -ForegroundColor Red
}

if ($remoteUrl -and $remoteUrl -notmatch "error") {
    Write-Host "✓ Remote URL: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "✗ Remote URL not set" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check repository state
Write-Host "Test 3: Checking repository state..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "✓ Git repository found" -ForegroundColor Green
    
    # Check for incomplete operations
    if (Test-Path .git/rebase-merge) {
        Write-Host "⚠ Incomplete rebase detected" -ForegroundColor Yellow
    }
    if (Test-Path .git/MERGE_HEAD) {
        Write-Host "⚠ Incomplete merge detected" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Not a Git repository" -ForegroundColor Red
}

Write-Host ""

# Test 4: Network connectivity (quick test)
Write-Host "Test 4: Testing network connectivity..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName github.com -Count 1 -Quiet -ErrorAction SilentlyContinue
    if ($ping) {
        Write-Host "✓ Can reach github.com" -ForegroundColor Green
    } else {
        Write-Host "⚠ Cannot reach github.com (may be firewall/network issue)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Network test failed: $_" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Simple Git command (no network)
Write-Host "Test 5: Testing basic Git command..." -ForegroundColor Yellow
try {
    $status = git status --short 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git commands working" -ForegroundColor Green
    } else {
        Write-Host "⚠ Git command returned error: $status" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Error running Git command: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Configuration Summary ===" -ForegroundColor Cyan
Write-Host "User: $userName" -ForegroundColor White
Write-Host "Email: $userEmail" -ForegroundColor White
Write-Host "Remote: $remoteUrl" -ForegroundColor White
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "To test actual GitHub connection, run manually:" -ForegroundColor Yellow
Write-Host "  git ls-remote origin" -ForegroundColor White
Write-Host ""
Write-Host "This will prompt for credentials if needed." -ForegroundColor Gray
Write-Host "Use your Personal Access Token as the password." -ForegroundColor Gray
Write-Host ""











