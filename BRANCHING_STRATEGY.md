# Git Branching Strategy

This document outlines the branching strategy for the YUMA Task Management System.

## 🌿 Branch Structure

We use a three-branch strategy for managing different environments:

```
main (default/development)
  ├── dev (development environment)
  ├── stage (staging environment)
  └── production (production environment)
```

## 📋 Branch Descriptions

### `main` Branch
- **Purpose:** Default branch, contains stable code
- **Environment:** Local development
- **Protection:** Protected, requires PR reviews
- **Workflow:** 
  - Feature branches merge here first
  - Acts as the integration branch
  - Code here should be stable and tested

### `dev` Branch
- **Purpose:** Development environment deployment
- **Environment:** Development server (e.g., dev.yourdomain.com)
- **Protection:** Protected, requires PR reviews
- **Workflow:**
  - Automatically deploys to development environment
  - Used for early testing and integration
  - Merged from `main` branch
  - Allows for rapid iteration and testing

### `stage` Branch
- **Purpose:** Staging environment deployment
- **Environment:** Staging server (e.g., stage.yourdomain.com)
- **Protection:** Protected, requires PR reviews and approval
- **Workflow:**
  - Merged from `dev` after testing
  - Used for pre-production testing
  - Mirrors production environment closely
  - Final testing before production release

### `production` Branch
- **Purpose:** Production environment deployment
- **Environment:** Production server (e.g., yourdomain.com)
- **Protection:** Highly protected, requires multiple approvals
- **Workflow:**
  - Merged from `stage` after thorough testing
  - Only stable, tested code goes here
  - Requires manual approval for deployment
  - Tagged with version numbers

## 🔄 Workflow

### Development Workflow

1. **Create Feature Branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Develop and Commit:**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and Create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create PR to main branch on GitHub
   ```

4. **After PR Approval, Merge to Main:**
   - PR is reviewed and approved
   - Merge to `main` branch
   - CI/CD runs tests and builds

### Deployment Workflow

#### To Development (dev branch)
```bash
git checkout main
git pull origin main
git checkout dev
git merge main
git push origin dev
# Automatically deploys to development environment
```

#### To Staging (stage branch)
```bash
git checkout dev
git pull origin dev
# Test in dev environment first
git checkout stage
git merge dev
git push origin stage
# Automatically deploys to staging environment
```

#### To Production (production branch)
```bash
git checkout stage
git pull origin stage
# Final testing in staging
git checkout production
git merge stage
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin production
git push origin --tags
# Requires manual approval, then deploys to production
```

## 🏷️ Version Tagging

Production releases should be tagged:

```bash
# Create a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags
```

Tag format: `vMAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

## 🔒 Branch Protection Rules

### Main Branch
- ✅ Require pull request reviews (1 approval minimum)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators

### Dev Branch
- ✅ Require pull request reviews (1 approval minimum)
- ✅ Require status checks to pass
- ✅ Allow force pushes (for rapid iteration)

### Stage Branch
- ✅ Require pull request reviews (2 approvals minimum)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ No force pushes

### Production Branch
- ✅ Require pull request reviews (2 approvals minimum)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ No force pushes
- ✅ Require deployment approval
- ✅ Include administrators

## 🚀 CI/CD Pipeline

### Automatic Actions

1. **On Push to Any Branch:**
   - Run linting
   - Run tests
   - Build application

2. **On Push to `dev`:**
   - Run full test suite
   - Build and deploy to development environment

3. **On Push to `stage`:**
   - Run full test suite
   - Run linter
   - Build and deploy to staging environment

4. **On Push to `production`:**
   - Run full test suite
   - Run linter
   - Build application
   - **Requires manual approval** before deployment
   - Deploy to production environment

## 📝 Branch Naming Conventions

### Feature Branches
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/code-improvement` - Refactoring
- `test/test-addition` - Test additions
- `chore/maintenance-task` - Maintenance

### Examples
```
feature/add-user-authentication
fix/resolve-calendar-timezone-issue
docs/update-api-documentation
refactor/optimize-database-queries
```

## 🔄 Hotfix Workflow

For urgent production fixes:

1. **Create Hotfix Branch from Production:**
   ```bash
   git checkout production
   git pull origin production
   git checkout -b hotfix/critical-bug-fix
   ```

2. **Fix and Test:**
   ```bash
   # Make fix
   git add .
   git commit -m "fix: critical bug fix"
   ```

3. **Merge to Production:**
   ```bash
   git checkout production
   git merge hotfix/critical-bug-fix
   git push origin production
   ```

4. **Backport to Other Branches:**
   ```bash
   git checkout stage
   git merge production
   git push origin stage

   git checkout dev
   git merge production
   git push origin dev

   git checkout main
   git merge production
   git push origin main
   ```

## 📊 Branch Status

| Branch | Status | Last Updated | Environment |
|--------|--------|--------------|-------------|
| main | Active | - | Local Dev |
| dev | Active | - | Development |
| stage | Active | - | Staging |
| production | Active | - | Production |

## 🆘 Troubleshooting

### Merge Conflicts
```bash
# Update your branch
git checkout your-branch
git pull origin main

# Resolve conflicts
# Then commit and push
git add .
git commit -m "fix: resolve merge conflicts"
git push origin your-branch
```

### Undo Last Commit (Before Push)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (After Push)
```bash
git revert HEAD
git push origin branch-name
```

## 📚 Additional Resources

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)

## ✅ Checklist for Production Release

- [ ] All tests passing in `dev`
- [ ] Code reviewed and approved
- [ ] Merged to `stage`
- [ ] Tested in staging environment
- [ ] All tests passing in `stage`
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version tag created
- [ ] Merged to `production`
- [ ] Deployment approved
- [ ] Production deployment successful
- [ ] Post-deployment verification completed

