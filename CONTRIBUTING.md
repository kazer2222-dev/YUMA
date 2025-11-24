# Contributing to YUMA Task Management System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to your branch: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

See the main [README.md](./README.md) for installation and setup instructions.

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

### React Components

- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript interfaces for props
- Keep components focused and reusable

### Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Code Formatting

- Run `npm run lint` before committing
- Fix any linting errors
- Use Prettier (if configured) for consistent formatting

## Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Maintain or improve test coverage
- Test your changes manually before submitting

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update CHANGELOG.md if applicable
5. Request review from maintainers
6. Address review feedback
7. Wait for approval before merging

## Pull Request Guidelines

- Use descriptive titles
- Fill out the PR template completely
- Link related issues
- Add screenshots for UI changes
- Keep PRs focused and reasonably sized
- Rebase on main before submitting if needed

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md):

- Provide clear description
- Include steps to reproduce
- Add expected vs actual behavior
- Include environment details
- Add screenshots if applicable

## Suggesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md):

- Describe the feature clearly
- Explain the use case
- Propose implementation approach
- Consider alternatives

## Questions?

- Open an issue for questions
- Check existing issues and PRs first
- Be patient and respectful

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.




