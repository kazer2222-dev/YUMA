# GitHub Integration Setup Guide

This guide will help you connect your local repository to GitHub and set up version control workflows.

## Prerequisites

- Git installed on your system
- A GitHub account
- Access to your local repository

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Choose a repository name (e.g., `yuma-task-management`)
5. Set visibility (Public or Private)
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Use these commands:

### Option A: If you haven't committed anything yet

```bash
cd "C:\Users\User\Desktop\task management project"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Option B: If you already have commits (current situation)

```bash
cd "C:\Users\User\Desktop\task management project"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.**

## Step 3: Verify Connection

Check that the remote is configured correctly:

```bash
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git (push)
```

## Step 4: Configure GitHub Actions Secrets (Optional but Recommended)

For CI/CD to work properly, you may need to set up secrets in GitHub:

1. Go to your repository on GitHub
2. Click on "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add the following secrets if needed:
   - `DATABASE_URL` - Your database connection string (for CI testing)
   - `NEXTAUTH_SECRET` - Secret for NextAuth.js
   - `NEXTAUTH_URL` - Your application URL
   - `OPENAI_API_KEY` - If using AI features in CI

## Step 5: Set Up Branch Protection (Recommended)

1. Go to "Settings" → "Branches"
2. Add a branch protection rule for `main`
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators

## Step 6: Enable GitHub Actions

GitHub Actions workflows are already configured in `.github/workflows/`:

- **CI/CD Pipeline** (`.github/workflows/ci.yml`): Runs linting, tests, and builds on push/PR
- **CodeQL Analysis** (`.github/workflows/codeql.yml`): Security scanning

These will automatically run when you push code or create pull requests.

## Daily Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request**
   - Go to your repository on GitHub
   - Click "Compare & pull request"
   - Fill out the PR template
   - Request reviews if needed
   - Merge after approval

### Syncing with Remote

```bash
# Fetch latest changes
git fetch origin

# Pull latest changes
git pull origin main

# Or if you're on a different branch
git pull origin main --rebase
```

## Branch Naming Conventions

Use descriptive branch names:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

Examples:
- `feature/add-user-authentication`
- `fix/resolve-calendar-bug`
- `docs/update-readme`

## Commit Message Guidelines

Write clear, descriptive commit messages:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(auth): add OAuth2 authentication

fix(calendar): resolve timezone display issue

docs(readme): update installation instructions
```

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. **Use Personal Access Token (Recommended)**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` scope
   - Use the token as your password when pushing

2. **Or use SSH**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

### Merge Conflicts

If you have merge conflicts:

1. Pull the latest changes
   ```bash
   git pull origin main
   ```

2. Resolve conflicts in your editor
3. Stage resolved files
   ```bash
   git add .
   ```

4. Complete the merge
   ```bash
   git commit -m "Resolve merge conflicts"
   ```

### Undo Last Commit (Before Push)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (After Push)

```bash
git revert HEAD
git push origin main
```

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Need Help?

If you encounter any issues:
1. Check the [GitHub Status](https://www.githubstatus.com/)
2. Review GitHub's [troubleshooting guide](https://docs.github.com/en/get-started/using-git/troubleshooting)
3. Open an issue in the repository
















