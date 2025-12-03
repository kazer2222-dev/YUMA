# Simple Branch Setup - Non-Interactive
Write-Host "Starting branch setup..." -ForegroundColor Cyan

# Check if dev branch exists locally
$devExists = git branch --list dev 2>$null
if ($devExists) {
    Write-Host "Dev branch exists locally" -ForegroundColor Green
    git checkout dev 2>&1 | Out-Null
    git push -u origin dev 2>&1
} else {
    Write-Host "Creating dev branch..." -ForegroundColor Yellow
    git checkout -b dev 2>&1 | Out-Null
    git push -u origin dev 2>&1
}

# Check if stage branch exists locally
$stageExists = git branch --list stage 2>$null
if ($stageExists) {
    Write-Host "Stage branch exists locally" -ForegroundColor Green
    git checkout stage 2>&1 | Out-Null
    git push -u origin stage 2>&1
} else {
    Write-Host "Creating stage branch..." -ForegroundColor Yellow
    git checkout main 2>&1 | Out-Null
    git checkout -b stage 2>&1 | Out-Null
    git push -u origin stage 2>&1
}

# Check if production branch exists locally
$prodExists = git branch --list production 2>$null
if ($prodExists) {
    Write-Host "Production branch exists locally" -ForegroundColor Green
    git checkout production 2>&1 | Out-Null
    git push -u origin production 2>&1
} else {
    Write-Host "Creating production branch..." -ForegroundColor Yellow
    git checkout main 2>&1 | Out-Null
    git checkout -b production 2>&1 | Out-Null
    git push -u origin production 2>&1
}

# Return to main
git checkout main 2>&1 | Out-Null
Write-Host "Branch setup complete!" -ForegroundColor Green
git branch -a







