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

### State Management
- **Recoil** for global state management
- Component-specific state with React hooks
- GraphQL cache managed by Apollo Client
- **React Hook Form** for form state management (preferred over manual useState)

### Form Handling Best Practices
When working with forms that use React Hook Form:
- **Prefer `formState.isSubmitting`** over manual loading states (useState)
- This automatically tracks the entire form submission lifecycle
- Prevents double submissions without manual state management
- Example:
  ```tsx
  const { form } = useFormHook();

  // ✅ GOOD: Use formState.isSubmitting
  <Button disabled={form.formState.isSubmitting} />

  // ❌ AVOID: Manual loading state when React Hook Form handles it
  const [isLoading, setIsLoading] = useState(false);
  // ... manual state management
  ```
- Only use manual loading states when you need to track operations beyond form submission

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
2. Test changes with relevant test suites
3. Ensure database migrations are properly structured
4. Check that GraphQL schema changes are backward compatible

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

### Testing Requirements for Bug Fixes
**IMPORTANT**: When fixing bugs, you MUST add tests to prevent regressions:

1. **Component fixes** (UI bugs, form behavior, interactions):
   - Create or update `__tests__/ComponentName.test.tsx` next to the component
   - Use `@testing-library/react` for rendering and user interactions
   - Wrap with required providers: `RecoilRoot`, `MemoryRouter` for routing
   - Test the specific bug scenario to ensure it's fixed
   - Example test structure:
     ```tsx
     import { render, waitFor, fireEvent } from '@testing-library/react';
     import { RecoilRoot } from 'recoil';

     describe('ComponentName', () => {
       it('should prevent double submission when button is clicked twice', async () => {
         const onSubmit = jest.fn();
         const { getByRole } = render(
           <RecoilRoot>
             <ComponentName onSubmit={onSubmit} />
           </RecoilRoot>
         );

         const button = getByRole('button');
         fireEvent.click(button);
         fireEvent.click(button); // Double click

         await waitFor(() => {
           expect(onSubmit).toHaveBeenCalledTimes(1); // Should only be called once
         });
       });
     });
     ```

2. **Hook fixes** (custom hooks, state management):
   - Create or update `__tests__/useHookName.test.tsx` in the hooks directory
   - Use `renderHook` from `@testing-library/react`
   - Provide necessary wrappers (RecoilRoot, context providers)
   - Test the bug scenario with the hook's behavior

3. **Backend fixes** (API, database, business logic):
   - Add unit tests in `__tests__/` directory near the fixed code
   - Add integration tests if the fix involves multiple modules
   - Mock external dependencies appropriately

### Running Tests After Changes
```bash
# Run tests for the modified component/module
npx nx test twenty-front --testPathPattern=ComponentName

# Run all tests for the package
npx nx test twenty-front

# Run tests in watch mode during development
npx nx test twenty-front --watch
```

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Development guidelines and best practices