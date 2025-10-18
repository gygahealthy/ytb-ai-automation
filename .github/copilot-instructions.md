# VS Code Copilot Custom Instructions

# VEO3 Automation Project

## Overview

This file provides custom instructions for GitHub Copilot when working on the VEO3 Automation project. These instructions ensure code consistency, quality, and adherence to project standards.

## Documentation Policy

### ❌ DO NOT

- Automatically create markdown (.md) documentation files after completing tasks
- Create files like: `IMPLEMENTATION_COMPLETE.md`, `DATABASE_IMPLEMENTATION.md`, `CHANGES.md`, etc.
- Generate documentation without explicit user request

### ✅ DO

- Only create documentation files when explicitly requested by the user
- Ask for confirmation before creating new .md files
- Update existing documentation only when instructed

## Code Quality Standards

### TypeScript

- Always use TypeScript strict mode
- Define explicit types for all function parameters and return values
- Avoid using `any` type unless absolutely necessary (document reasoning if used)
- Follow existing code patterns and architecture in the project

### Error Handling

- Always use try-catch blocks for error-prone operations
- Log important operations using the Logger utility from `src/core/logging`
- Provide meaningful error messages that indicate what went wrong
- Return proper error responses using `ApiResponse<T>` pattern

### Code Patterns

- Follow existing code patterns in the repository
- Maintain consistency with established conventions
- Review similar implementations before writing new code
- Refactor only when requested or critical

## Database Rules

### Repository Pattern

### Direct Database Access

- ❌ **NEVER** bypass repositories to access the database directly
- ❌ **NEVER** write raw SQL queries in services
- ❌ **NEVER** use `sqlite-database` directly outside of repositories

### Database Engine

- SQLite is the database engine
- Uses `better-sqlite3` package
- All migrations should be placed in `src/main/storage/migrations/`

### Example - Correct Pattern

```typescript
// ✅ CORRECT
const users = await profileRepository.findAll();
const user = await profileRepository.findById(1);

// ❌ WRONG
const users = await database.query("SELECT * FROM profiles");
const connection = sqlite3.open(":memory:");
```

## Service Layer Architecture

### Service Responsibilities

- Services should **ONLY** interact with repositories
- Keep business logic in services, data access in repositories
- Never import or use database classes directly in services

### Dependency Injection

- Services should accept repositories through constructor
- Maintain loose coupling between layers
- Inject dependencies rather than creating instances

## File Organization

### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `VideoPlayer.tsx`)
- Pages: `PascalCase.tsx` (e.g., `VideoCreationPage.tsx`)
- Utilities: `camelCase.ts` (e.g., `videoUtils.ts`)
- Types: `camelCase.ts` (e.g., `videoTypes.ts`)
- Services: `camelCase.ts` (e.g., `videoService.ts`)
- Repositories: `camelCase.ts` (e.g., `videoRepository.ts`)

## Testing & Linting

### Before Completing Tasks

1. ✅ Run linter: `npm run lint`
2. ✅ Fix all linting errors
3. ✅ Verify TypeScript compilation: `npm run build`
4. ✅ Check for any console errors or warnings

### When Requesting Help

- Include error messages and stack traces
- Specify which command was running when error occurred
- Provide context about what was being attempted

## Git & Version Control

### Commits

- ❌ **NEVER** commit code automatically unless explicitly requested
- ❌ **NEVER** force push to main/master branches
- Always explain changes before committing

### Workflow

- Create descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused on single features/fixes

## Windows Environment

### Terminal Commands

- Use **PowerShell** compatible commands
- Avoid Unix-specific shell syntax (`&&`, `||`)
- Use semicolons or separate commands in PowerShell
- Example:

  ```powershell
  # ✅ Correct
  npm run build; npm run lint

  # ❌ Avoid
  npm run build && npm run lint
  ```

### Path Handling

- Use backslashes `\` or forward slashes `/` (both work in Node.js)
- Wrap paths with spaces in quotes
- Use `path.join()` for cross-platform compatibility

## Electron-Specific Guidelines

### IPC Communication

- Use the `electronApi` object for renderer-process communication
- All IPC handlers should be registered in `src/main/handlers/`
- Type all IPC messages and responses
- Validate data before processing in handlers

### Main Process

- Keep main process lightweight
- Delegate heavy operations to services
- Handle window management in main.ts
- Use preload.ts for API exposure

### Renderer Process

- Use React hooks for state management
- Implement proper error boundaries
- Handle IPC errors gracefully
- Show user feedback for long operations

## React & TypeScript Patterns

### Component Structure

```typescript
// ✅ Use functional components with hooks
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initial);

  useEffect(() => {
    // side effects
  }, [dependencies]);

  return <div>{...}</div>;
};

export default MyComponent;
```

### Styling

- Use Tailwind CSS utility classes
- Support dark mode with `dark:` prefix
- Use `className` prop for conditional styles
- Prefer component composition over inline styles

### Hooks

- Extract custom hooks to `src/renderer/hooks/`
- Use meaningful hook names (e.g., `useVideoCreation`)
- Document hook parameters and return values

## Performance Considerations

### Optimization

- Memoize expensive computations with `useMemo`
- Prevent unnecessary re-renders with `React.memo`
- Lazy load components when appropriate
- Minimize bundle size by tree-shaking unused code

### Async Operations

- Always handle loading and error states
- Show progress indicators for long operations
- Cancel requests when components unmount
- Implement proper timeout handling

## Security Guidelines

### Data Handling

- Validate all user inputs
- Sanitize data before database operations
- Never expose sensitive credentials
- Use environment variables for secrets

### Authentication

- Implement proper session management
- Validate tokens on every request
- Log security-related events
- Handle auth errors gracefully

## Common Patterns in This Project

### Repository Pattern

```typescript
class UserRepository {
  findById(id: number): User | null { ... }
  findAll(): User[] { ... }
  save(user: User): User { ... }
  delete(id: number): boolean { ... }
}
```

### Service Pattern

```typescript
class UserService {
  constructor(private repository: UserRepository) {}

  async getUser(id: number): Promise<ApiResponse<User>> {
    try {
      const user = this.repository.findById(id);
      return { success: !!user, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## Helpful Resources

- Project Architecture Documentation: `docs/project_architecture.md`
- IPC Event Debugging: `docs/IPC_EVENT_DEBUGGING.md`
- TypeScript Configuration: `tsconfig.json`
- ESLint Configuration: `.eslintrc.cjs`

## Quick Checklist for Every Task

- [ ] Code follows project patterns and conventions
- [ ] TypeScript strict mode compliance verified
- [ ] Repository pattern used for data access
- [ ] Error handling implemented with try-catch
- [ ] Logging added for important operations
- [ ] No direct database access outside repositories
- [ ] ApiResponse<T> pattern used for service returns
- [ ] Linter passes: `npm run lint`
- [ ] TypeScript compiles: `npm run build`
- [ ] No console errors or warnings
- [ ] Documentation created only if requested
- [ ] Commit messages are descriptive (if committing)
- [ ] Code reviewed against similar implementations

## Questions?

When something is unclear:

1. Check existing code patterns in the project
2. Review relevant documentation in `/docs` folder
3. Look at similar implementations
4. Ask for clarification rather than guessing
