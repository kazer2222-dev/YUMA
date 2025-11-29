# Branching Strategy

This project uses a three-branch strategy for managing different environments.

## 🌿 Branch Structure

### Main Branches

1. **`main`** - Production-ready code
   - Stable, tested code
   - Protected branch (requires PR approval)
   - Deploys to production environment

2. **`dev`** - Development branch
   - Active development work
   - Integration testing
   - Deploys to development environment

3. **`stage`** - Staging branch
   - Pre-production testing
   - User acceptance testing (UAT)
   - Deploys to staging environment

4. **`production`** - Production deployment branch
   - Final production releases
   - Tagged releases
   - Deploys to production environment

## 🔄 Workflow

### Development Flow

```
main → dev → stage → production
```

1. **Development:**
   - Work happens on `dev` branch
   - Features are merged into `dev`
   - Continuous integration runs on `dev`

2. **Staging:**
   - When `dev` is stable, merge to `stage`
   - Perform testing and QA
   - User acceptance testing

3. **Production:**
   - When `stage` is approved, merge to `production`
   - Create release tags
   - Deploy to production

### Feature Development

1. Create feature branch from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. Develop and commit:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/your-feature-name
   # Create PR to merge into dev
   ```

4. After PR approval, merge to `dev`

## 📋 Branch Protection Rules

### Recommended Settings (Set in GitHub)

**`main` branch:**
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict who can push

**`production` branch:**
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

**`stage` branch:**
- Require status checks to pass

**`dev` branch:**
- Allow direct pushes (for active development)

## 🚀 Deployment

Each branch deploys to its corresponding environment:

- **`dev`** → Development environment
- **`stage`** → Staging environment
- **`production`** → Production environment

Deployment is automated via GitHub Actions workflows:
- `.github/workflows/deploy-dev.yml`
- `.github/workflows/deploy-stage.yml`
- `.github/workflows/deploy-production.yml`

## 📝 Best Practices

1. **Never push directly to `production`**
   - Always use pull requests
   - Require code review
   - Run all tests

2. **Keep `dev` up to date**
   - Regularly merge `main` into `dev`
   - Resolve conflicts early

3. **Test in `stage` before production**
   - Use staging for final testing
   - Verify all features work
   - Check performance

4. **Use meaningful commit messages**
   - Follow conventional commits
   - `feat:`, `fix:`, `docs:`, etc.

5. **Tag releases**
   - Tag `production` branch with version numbers
   - Use semantic versioning (v1.0.0, v1.1.0, etc.)

## 🔧 Setup Commands

### Initial Setup

```bash
# Create dev branch
git checkout -b dev
git push -u origin dev

# Create stage branch
git checkout -b stage
git push -u origin stage

# Create production branch
git checkout -b production
git push -u origin production

# Switch back to main
git checkout main
```

### Daily Workflow

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# After feature is done
git checkout dev
git merge feature/my-feature
git push origin dev

# Deploy to staging
git checkout stage
git merge dev
git push origin stage

# Deploy to production
git checkout production
git merge stage
git push origin production
```

## 📊 Branch Status

- ✅ `main` - Main branch (exists)
- ✅ `dev` - Development branch (configured)
- ✅ `stage` - Staging branch (configured)
- ✅ `production` - Production branch (configured)

**Note:** Run `.\verify-branch-setup.ps1` to verify all branches are properly set up locally and on GitHub.

---

**Repository:** https://github.com/kazer2222-dev/YUMA
