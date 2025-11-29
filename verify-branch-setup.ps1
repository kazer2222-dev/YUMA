# Branch Setup Verification Script
# This script verifies that all branches are properly set up

Write-Host "=== Verifying 3-Branch Strategy Setup ===" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Git repository
if (-not (Test-Path .git)) {
    Write-Host "[X] Not a git repository" -ForegroundColor Red
    exit 1
}

# Check remote configuration
Write-Host "Checking remote configuration..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "  [OK] Remote URL: $remoteUrl" -ForegroundColor Green
    if ($remoteUrl -match "kazer2222-dev/YUMA") {
        Write-Host "  [OK] Correct repository" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Repository may be incorrect" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "  [X] No remote configured" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check branches
Write-Host "Checking branches..." -ForegroundColor Yellow
$requiredBranches = @("main", "dev", "stage", "production")
$branchStatus = @{}

foreach ($branch in $requiredBranches) {
    $localExists = git branch --list $branch 2>$null
    $remoteExists = git branch -r --list "origin/$branch" 2>$null
    
    $status = @{
        Local = [bool]$localExists
        Remote = [bool]$remoteExists
    }
    $branchStatus[$branch] = $status
    
    $statusIcon = if ($localExists -and $remoteExists) { "[OK]" } elseif ($localExists) { "[WARN]" } else { "[X]" }
    $statusColor = if ($localExists -and $remoteExists) { "Green" } elseif ($localExists) { "Yellow" } else { "Red" }
    
    Write-Host "  $statusIcon $branch" -ForegroundColor $statusColor
    Write-Host "    Local: $(if ($localExists) { '[OK]' } else { '[X]' })" -ForegroundColor $(if ($localExists) { "Green" } else { "Red" })
    Write-Host "    Remote: $(if ($remoteExists) { '[OK]' } else { '[X]' })" -ForegroundColor $(if ($remoteExists) { "Green" } else { "Red" })
    
    if (-not $localExists -or -not $remoteExists) {
        $allGood = $false
    }
}
Write-Host ""

# Check branch tracking
Write-Host "Checking branch tracking..." -ForegroundColor Yellow
$trackingInfo = git branch -vv 2>$null
$trackedBranches = 0

foreach ($branch in $requiredBranches) {
    $tracking = $trackingInfo | Select-String -Pattern "^\s*\*?\s*$branch\s+.*\[origin/$branch"
    if ($tracking) {
        Write-Host "  [OK] $branch is tracking origin/$branch" -ForegroundColor Green
        $trackedBranches++
    } else {
        Write-Host "  [WARN] $branch tracking not configured" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check workflows
Write-Host "Checking workflow files..." -ForegroundColor Yellow
$workflows = @(
    ".github/workflows/ci.yml",
    ".github/workflows/codeql.yml",
    ".github/workflows/deploy-dev.yml",
    ".github/workflows/deploy-stage.yml",
    ".github/workflows/deploy-production.yml"
)

foreach ($workflow in $workflows) {
    if (Test-Path $workflow) {
        Write-Host "  [OK] $workflow" -ForegroundColor Green
    } else {
        Write-Host "  [X] $workflow (missing)" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($allGood -and $trackedBranches -eq $requiredBranches.Count) {
    Write-Host "[OK] All branches are properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Set up branch protection rules on GitHub" -ForegroundColor White
    Write-Host "2. Configure GitHub Secrets for deployment" -ForegroundColor White
    Write-Host "3. Test the deployment workflows" -ForegroundColor White
} else {
    Write-Host "[WARN] Some branches need attention" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run the setup script to fix:" -ForegroundColor Yellow
    Write-Host "  .\complete-branch-setup.ps1" -ForegroundColor White
}

Write-Host ""

