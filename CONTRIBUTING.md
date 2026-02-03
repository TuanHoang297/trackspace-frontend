# 🤝 Contributing to TrackSpace Frontend

Thank you for considering contributing to TrackSpace! We welcome contributions from everyone.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Collaborate professionally
- Report unacceptable behavior

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/trackspace-frontend.git
   cd trackspace-frontend
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/TuanHoang297/trackspace-frontend.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Testing improvements

### Before Committing
```bash
# Run linter
npm run lint

# Run tests
npm test

# Build to check for errors
npm run build
```

## 📐 Coding Standards

### TypeScript
- Use TypeScript strict mode
- Define types explicitly (avoid `any`)
- Use interfaces for objects
- Export types from `src/types/`

### React Components
- Use functional components with hooks
- Keep components < 300 lines
- Extract logic to custom hooks
- Use descriptive prop names

### File Structure
```typescript
// ComponentName.tsx
import React from 'react';
import type { ComponentNameProps } from './types';

export const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // Component logic
  return <div>...</div>;
};

export default ComponentName;
```

### Styling
- Use MUI styled components
- Follow theme configuration
- Avoid inline styles

### State Management
- RTK Query for API calls
- Redux Toolkit for global UI state
- React Hook Form for forms
- Local state for UI toggles

## ✍️ Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(auth): add JWT authentication
fix(jira): resolve sprint board drag-drop issue
docs(readme): update installation instructions
refactor(api): restructure RTK Query services
```

## 🔄 Pull Request Process

### 1. Update Your Branch
```bash
git fetch upstream
git rebase upstream/main
```

### 2. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request
- Use descriptive title
- Fill out PR template completely
- Reference related issues
- Add screenshots/videos for UI changes

### 4. PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Build passes (`npm run build`)
- [ ] All tests pass (`npm test`)

### 5. Code Review
- Address reviewer feedback
- Keep discussion professional
- Make requested changes promptly

### 6. Merge
- Squash commits if needed
- Update commit message
- Delete feature branch after merge

## 🧪 Testing Guidelines

### Unit Tests
- Test utility functions
- Test custom hooks
- Use Vitest

### Component Tests
- Test user interactions
- Test error states
- Use React Testing Library

### Integration Tests
- Test API services
- Test complete flows

## 📚 Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Update TypeScript types
- Create diagrams if needed

## 🐛 Reporting Bugs

Use [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md):
- Describe the bug clearly
- Provide steps to reproduce
- Include screenshots
- Specify environment details

## 💡 Suggesting Features

Use [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md):
- Describe the feature
- Explain use case
- Provide mockups if applicable

## ❓ Questions?

- Open a [Discussion](https://github.com/TuanHoang297/trackspace-frontend/discussions)
- Check existing [Issues](https://github.com/TuanHoang297/trackspace-frontend/issues)
- Contact team via email

---

Thank you for contributing! 🎉
