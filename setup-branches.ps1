# Setup 3-Branch Strategy Script
# This script creates dev, stage, and production branches

Write-Host "=== Setting Up 3-Branch Strategy ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "✗ Not a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
Write-Host ""

# Function to create and push branch
function Create-Branch {
    param($branchName)
    
    Write-Host "Creating branch: $branchName" -ForegroundColor Yellow
    
    # Check if branch already exists
    $branchExists = git branch -a | Select-String -Pattern "^\s*(remotes/origin/)?$branchName$"
    
    if ($branchExists) {
        Write-Host "  ⚠️  Branch $branchName already exists" -ForegroundColor Yellow
        $overwrite = Read-Host "  Do you want to checkout and update it? (y/n)"
        if ($overwrite -eq 'y' -or $overwrite -eq 'Y') {
            git checkout $branchName
            git pull origin $branchName 2>$null
            Write-Host "  ✓ Checked out $branchName" -ForegroundColor Green
        } else {
            Write-Host "  ⊘ Skipped $branchName" -ForegroundColor Gray
            return $false
        }
    } else {
        # Create branch from current branch
        git checkout -b $branchName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Created branch $branchName" -ForegroundColor Green
            
            # Push to remote
            git push -u origin $branchName
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Pushed $branchName to remote" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  Failed to push $branchName (may need authentication)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ✗ Failed to create branch $branchName" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Ensure we're on main branch first
if ($currentBranch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Could not switch to main. Creating branches from current branch: $currentBranch" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Switched to main branch" -ForegroundColor Green
        git pull origin main 2>$null
    }
}

Write-Host ""

# Create branches
$branches = @("dev", "stage", "production")
$created = @()

foreach ($branch in $branches) {
    if (Create-Branch $branch) {
        $created += $branch
    }
    Write-Host ""
}

# Switch back to main
Write-Host "Switching back to main branch..." -ForegroundColor Yellow
git checkout main 2>$null
Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Branches created/updated:" -ForegroundColor Yellow
foreach ($branch in $created) {
    Write-Host "  ✓ $branch" -ForegroundColor Green
}

Write-Host ""
Write-Host "Current branch structure:" -ForegroundColor Yellow
git branch -a | ForEach-Object {
    if ($_ -match "^\*?\s*(remotes/origin/)?(main|dev|stage|production)$") {
        Write-Host "  $_" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Verify branches: git branch -a" -ForegroundColor White
Write-Host "2. Set up branch protection in GitHub (recommended)" -ForegroundColor White
Write-Host "3. Configure deployment workflows for each branch" -ForegroundColor White
Write-Host ""

