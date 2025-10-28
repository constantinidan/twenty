# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Twenty is an open-source CRM built with modern technologies in a monorepo structure. The codebase is organized as an Nx workspace with multiple packages.

## Key Commands

### Development
```bash
# Start development environment (frontend + backend + worker)
yarn start

# Individual package development
npx nx start twenty-front     # Start frontend dev server
npx nx start twenty-server    # Start backend server
npx nx run twenty-server:worker  # Start background worker
```

### Testing
```bash
# Run tests
npx nx test twenty-front      # Frontend unit tests
npx nx test twenty-server     # Backend unit tests
npx nx run twenty-server:test:integration:with-db-reset  # Integration tests with DB reset

# Storybook
npx nx storybook:build twenty-front         # Build Storybook
npx nx storybook:serve-and-test:static twenty-front     # Run Storybook tests
```

### Code Quality
```bash
# Linting
npx nx lint twenty-front      # Frontend linting
npx nx lint twenty-server     # Backend linting
npx nx lint twenty-front --fix  # Auto-fix linting issues

# Type checking
npx nx typecheck twenty-front
npx nx typecheck twenty-server

# Format code
npx nx fmt twenty-front
npx nx fmt twenty-server
```

### Build
```bash
# Build packages
npx nx build twenty-front
npx nx build twenty-server
```

### Database Operations
```bash
# Database management
npx nx database:reset twenty-server         # Reset database
npx nx run twenty-server:database:init:prod # Initialize database
npx nx run twenty-server:database:migrate:prod # Run migrations

# Generate migration
npx nx run twenty-server:typeorm migration:generate src/database/typeorm/core/migrations/[name] -d src/database/typeorm/core/core.datasource.ts

# Sync metadata
npx nx run twenty-server:command workspace:sync-metadata -f
```

### GraphQL
```bash
# Generate GraphQL types
npx nx run twenty-front:graphql:generate
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Recoil (state management), Emotion (styling), Vite
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, GraphQL (with GraphQL Yoga)
- **Monorepo**: Nx workspace managed with Yarn 4

### Package Structure
```
packages/
├── twenty-front/          # React frontend application
├── twenty-server/         # NestJS backend API
├── twenty-ui/             # Shared UI components library
├── twenty-shared/         # Common types and utilities
├── twenty-emails/         # Email templates with React Email
├── twenty-website/        # Next.js documentation website
├── twenty-zapier/         # Zapier integration
└── twenty-e2e-testing/    # Playwright E2E tests
```

### Key Development Principles
- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party interfaces)
- **String literals over enums** (except for GraphQL enums)
- **No 'any' type allowed**
- **Event handlers preferred over useEffect** for state updates
- **Explicit type annotations for useState** - Always provide type parameter to useState (e.g., `useState<boolean>(false)`) for clarity and maintainability
- **Import ordering** - Place React imports (useState, useEffect, etc.) before third-party library imports, after emotion/styled imports

### State Management
- **Recoil** for global state management
- Component-specific state with React hooks
- GraphQL cache managed by Apollo Client

### Async Error Handling Patterns
When managing loading states in async operations:
- **Use try/catch/finally for cleanup** - Place state cleanup (like `setIsLoading(false)`) in the `finally` block, not the `catch` block
- This ensures cleanup happens whether the operation succeeds or fails
- Example pattern for form submissions:
  ```typescript
  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await apiCall(values);
      // Success handling
    } catch (error) {
      // Error handling (snackbar, form reset)
    } finally {
      setIsLoading(false); // Always cleanup
    }
  };
  ```

### Backend Architecture
- **NestJS modules** for feature organization
- **TypeORM** for database ORM with PostgreSQL
- **GraphQL** API with code-first approach
- **Redis** for caching and session management
- **BullMQ** for background job processing

### Database
- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **TypeORM migrations** for schema management
- **ClickHouse** for analytics (when enabled)

## Development Workflow

### Before Making Changes
1. Always run linting and type checking after code changes
2. **Write tests for your changes** - This is mandatory, not optional
3. Test changes with relevant test suites and ensure all tests pass
4. Ensure database migrations are properly structured
5. Check that GraphQL schema changes are backward compatible

### After Implementing a Fix
1. **Add unit tests** that verify the fix works and prevents regression
2. Run `npx nx test [package-name]` to ensure tests pass
3. Run `npx nx lint [package-name]` to check code style
4. Run `npx nx typecheck [package-name]` to verify type safety
5. Review your changes to ensure they follow project conventions

### Code Style Notes
- Use **Emotion** for styling with styled-components pattern
- Follow **Nx** workspace conventions for imports
- Use **Lingui** for internationalization
- Components should be in their own directories with tests and stories

### Testing Strategy
- **Unit tests** with Jest for both frontend and backend
- **Integration tests** for critical backend workflows
- **Storybook** for component development and testing
- **E2E tests** with Playwright for critical user flows

### Test Requirements for Bug Fixes
When fixing bugs, ALWAYS add tests to verify the fix:
- **User-facing bugs** (UI/UX issues) should include unit tests for the component logic
- **Form submission bugs** should test loading states, button disabled states, and prevent duplicate submissions
- **Race condition bugs** should test that the fix prevents the race condition scenario
- Place tests in `__tests__` folder next to the file being tested (e.g., `hooks/__tests__/useMyHook.test.ts`)
- Run tests with `npx nx test [package-name]` to verify they pass

### Testing Patterns
Frontend tests should follow these patterns:
- **Use @testing-library/react** - `renderHook` for hooks, `render` for components
- **Wrap with TestWrapper** - Provide RecoilRoot and MemoryRouter for components using Recoil state or routing
- **Mock external dependencies** - Use jest.mock() for API calls, external services
- **Test user interactions** - Use `fireEvent` or `userEvent` from @testing-library to simulate clicks, form inputs
- **Test async behavior** - Use `waitFor` from @testing-library for async state updates
- **Example test structure**:
  ```typescript
  describe('ComponentName', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle loading state correctly', async () => {
      // Arrange: render component/hook
      // Act: trigger action
      // Assert: verify expected behavior
    });
  });
  ```

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Development guidelines and best practices