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


When testing the UI end to end, click on "Continue with Email" and use the prefilled credentials.
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
npx nx run twenty-server:command workspace:sync-metadata
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

#### Component Instance State Pattern
**When to use:** For features where state needs to:
- Be shared between distant parent and child components in the tree
- Be scoped to specific component instances (e.g., per widget/per table)
- Synchronize derived data state with independent UI state
- Persist across component unmounts/remounts within the same instance

**When NOT to use:** For simple parent-child state sharing (use props), local component state, or one-time data fetching.

For features that need the above requirements, use the component instance context pattern:

1. **Create a component instance context** in a `states/contexts/` directory:
   ```typescript
   // states/contexts/MyComponentInstanceContext.ts
   import { createComponentInstanceContext } from '@/ui/utilities/state/component-state/utils/createComponentInstanceContext';
   export const MyComponentInstanceContext = createComponentInstanceContext();
   ```

2. **Create component-scoped Recoil state** that uses the context:
   ```typescript
   // states/myComponentState.ts
   import { createComponentState } from '@/ui/utilities/state/component-state/utils/createComponentState';
   import { MyComponentInstanceContext } from './contexts/MyComponentInstanceContext';

   export const myComponentState = createComponentState({
     key: 'myComponentState',
     defaultValue: false,
     componentInstanceContext: MyComponentInstanceContext,
   });
   ```

3. **Wrap components with the context provider** at the appropriate level (where the component instance ID is available):
   ```typescript
   <MyComponentInstanceContext.Provider value={{ instanceId: widget.id }}>
     <MyComponent />
   </MyComponentInstanceContext.Provider>
   ```

4. **Use Effect components to synchronize state** between data hooks and UI state:
   ```typescript
   // components/MyComponentEffect.tsx
   export const MyComponentEffect = ({ value }) => {
     const setMyState = useSetRecoilComponentState(myComponentState);

     useEffect(() => {
       setMyState(value);
     }, [value, setMyState]);

     return null;
   };
   ```

5. **Access the state in consuming components** using component state hooks:
   ```typescript
   const [myState, setMyState] = useRecoilComponentState(myComponentState);
   ```

This pattern ensures proper state scoping per component instance and clean separation between data fetching and UI state management.

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

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library IDs and get library docs without waiting for explicit requests.

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

### Creating New UI Components in twenty-ui
When creating new reusable UI components in the twenty-ui package:

1. **Create the component** in the appropriate category directory (e.g., `packages/twenty-ui/src/display/banner/components/`)

2. **Export from the category index** (`packages/twenty-ui/src/display/index.ts`):
   ```typescript
   export type { MyComponentProps } from './path/to/MyComponent';
   export { MyComponent } from './path/to/MyComponent';
   ```

3. **Create Storybook stories** in a `__stories__` subdirectory:
   ```typescript
   // components/__stories__/MyComponent.stories.tsx
   import { type Meta, type StoryObj } from '@storybook/react';
   import { ComponentDecorator } from '@ui/testing';
   import { MyComponent } from '../MyComponent';

   const meta: Meta<typeof MyComponent> = {
     title: 'UI/Display/Category/MyComponent',
     component: MyComponent,
     decorators: [ComponentDecorator],
   };

   export default meta;
   type Story = StoryObj<typeof MyComponent>;

   export const Default: Story = {
     args: {
       // component props
     },
   };
   ```

4. **Use existing UI patterns** - Check similar components in twenty-ui for styling patterns and prop naming conventions before creating new components

### Testing Strategy
- **Unit tests** with Jest for both frontend and backend
- **Integration tests** for critical backend workflows
- **Storybook** for component development and testing
- **E2E tests** with Playwright for critical user flows

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Development guidelines and best practices
