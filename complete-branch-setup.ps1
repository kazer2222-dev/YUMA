# Complete Branch Setup Script
# This script verifies and completes the 3-branch strategy setup

Write-Host "=== Completing 3-Branch Strategy Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "[X] Not a git repository. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Get current branch
$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    Write-Host "[WARN] Could not determine current branch" -ForegroundColor Yellow
    $currentBranch = "unknown"
} else {
    Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
}
Write-Host ""

# Function to check and setup branch
function Setup-Branch {
    param($branchName)
    
    Write-Host "Processing branch: $branchName" -ForegroundColor Cyan
    
    # Check if branch exists locally
    $localBranch = git branch --list $branchName 2>$null
    $remoteBranch = git branch -r --list "origin/$branchName" 2>$null
    
    if ($localBranch) {
        Write-Host "  [OK] Local branch exists" -ForegroundColor Green
        
        # Checkout the branch
        git checkout $branchName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Checked out $branchName" -ForegroundColor Green
            
            # Push if not on remote
            if (-not $remoteBranch) {
                Write-Host "  -> Pushing to remote..." -ForegroundColor Yellow
                git push -u origin $branchName 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  [OK] Pushed $branchName to remote" -ForegroundColor Green
                } else {
                    Write-Host "  [WARN] Failed to push $branchName (may need authentication)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  [OK] Remote branch exists" -ForegroundColor Green
            }
        } else {
            Write-Host "  [WARN] Could not checkout $branchName" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  -> Creating branch from current branch..." -ForegroundColor Yellow
        
        # Ensure we're on main or a stable branch
        if ($currentBranch -ne "main" -and $currentBranch -ne "dev") {
            Write-Host "  -> Switching to main first..." -ForegroundColor Yellow
            git checkout main 2>$null
            if ($LASTEXITCODE -eq 0) {
                $currentBranch = "main"
            }
        }
        
        # Create branch
        git checkout -b $branchName 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Created branch $branchName" -ForegroundColor Green
            
            # Push to remote
            Write-Host "  -> Pushing to remote..." -ForegroundColor Yellow
            git push -u origin $branchName 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] Pushed $branchName to remote" -ForegroundColor Green
            } else {
                Write-Host "  [WARN] Failed to push $branchName (may need authentication)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [X] Failed to create branch $branchName" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Process all branches
$branches = @("dev", "stage", "production")
foreach ($branch in $branches) {
    Setup-Branch $branch
}

# Switch back to main
Write-Host "Switching back to main branch..." -ForegroundColor Yellow
git checkout main 2>$null
Write-Host ""

# Summary
Write-Host "=== Setup Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Branch Status:" -ForegroundColor Yellow
git branch -a 2>$null | ForEach-Object {
    $line = $_.Trim()
    if ($line -match "^\*?\s*(remotes/origin/)?(main|dev|stage|production)$") {
        if ($line -match "^\*") {
            Write-Host "  -> $line" -ForegroundColor Cyan
        } elseif ($line -match "remotes/origin") {
            Write-Host "  [OK] $line" -ForegroundColor Green
        } else {
            Write-Host "  - $line" -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Verify branches on GitHub: https://github.com/kazer2222-dev/YUMA/branches" -ForegroundColor White
Write-Host "2. Set up branch protection rules in GitHub Settings" -ForegroundColor White
Write-Host "3. Verify workflows are configured for each branch" -ForegroundColor White
Write-Host "4. Test deployment workflows" -ForegroundColor White
Write-Host ""

