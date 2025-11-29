# Branch Quick Reference

## 🚀 Quick Commands

### Check Branch Status
```powershell
.\verify-branch-setup.ps1
```

### Complete Branch Setup
```powershell
.\complete-branch-setup.ps1
```

### View All Branches
```powershell
git branch -a
```

### Switch Branch
```powershell
git checkout dev
git checkout stage
git checkout production
git checkout main
```

## 📋 Common Workflows

### Start New Feature
```powershell
git checkout dev
git pull origin dev
git checkout -b feature/my-feature-name
# Make changes...
git add .
git commit -m "feat: description"
git push origin feature/my-feature-name
# Create PR on GitHub to merge into dev
```

### Deploy to Development
```powershell
git checkout dev
git pull origin dev
# Make changes or merge PR
git push origin dev
# GitHub Actions automatically deploys
```

### Deploy to Staging
```powershell
git checkout stage
git pull origin stage
git merge dev
git push origin stage
# GitHub Actions automatically deploys
```

### Deploy to Production
```powershell
git checkout production
git pull origin production
git merge stage
git push origin production
# GitHub Actions automatically deploys
# Then create release tag:
git tag v1.0.0
git push origin v1.0.0
```

## 🔍 Troubleshooting

### Branch Not on Remote
```powershell
git checkout branch-name
git push -u origin branch-name
```

### Update Local Branch
```powershell
git checkout branch-name
git pull origin branch-name
```

### View Branch Differences
```powershell
git diff dev..stage
git diff stage..production
```

## 📚 More Information

- Full guide: `BRANCHING_STRATEGY.md`
- Next steps: `NEXT_STEPS.md`
- GitHub setup: `GITHUB_SETUP.md`

