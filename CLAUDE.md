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

### Testing Strategy
- **Unit tests** with Jest for both frontend and backend
- **Integration tests** for critical backend workflows
- **Storybook** for component development and testing
- **E2E tests** with Playwright for critical user flows

#### Test Completeness Requirements
When modifying utility functions or core logic:
1. **Update existing tests**: Modify test expectations to reflect new behavior
2. **Add comprehensive test cases**: If a feature works for one field type, it should have tests for ALL related field types
   - Example: If you modify email merging, also test phones and links merging (if they use the same pattern)
3. **Cover all scenarios**:
   - Basic merge operations
   - Deduplication behavior
   - Priority record selection
   - Edge cases (empty values, single records, all additional items, etc.)
4. **Test both unit AND integration levels**: Utility functions need unit tests AND integration tests showing real-world usage

## Utility Function Implementation Patterns

### Discovery Before Implementation
When implementing new utility functions or modifying existing ones:
1. **Search the codebase** for similar utility functions and analyze their patterns
2. **Look at test files** for the utilities to understand expected behavior and patterns
3. **Check if related utilities exist**: If modifying one composite field utility (emails), check if similar utilities exist (phones, links) and ensure consistency
4. **Review existing tests carefully**: Test expectations reveal the intended behavior and logic flow

### Composite Field Merging
When implementing utilities to merge composite fields (emails, phones, links):

1. **Collect All Values First**: Create a single array that collects ALL primary and additional values from all records
   - Example: `allEmails: string[] = []` (not `allAdditionalEmails`)
   - Add ALL primary values from all records to this array
   - Add ALL additional/secondary values from all records to this array

2. **Deduplicate**: Use Set (for primitives) or uniqBy (for objects) to remove duplicates
   - Maintain deduplication based on the key value (email string, phone number, link URL)

3. **Filter Out Priority**: After deduplication, filter to exclude the priority record's primary value
   - The priority record's primary value was already selected as the result's primary field
   - Keep everything else (including other records' primary values, which become additional/secondary)

4. **Example Pattern**:
   ```typescript
   // 1. Collect ALL values (primary + additional from all records)
   const allEmails: string[] = [];
   recordsWithValues.forEach((record) => {
     // Add primary email from this record
     if (hasRecordFieldValue(record.value.primaryEmail)) {
       allEmails.push(record.value.primaryEmail);
     }
     // Add additional emails from this record
     const additionalEmails = parseArrayOrJsonStringToArray<string>(record.value.additionalEmails);
     allEmails.push(...additionalEmails.filter((email) => hasRecordFieldValue(email)));
   });

   // 2. Deduplicate
   const uniqueEmails = Array.from(new Set(allEmails));

   // 3. Filter out the priority record's primary value
   const resultEmails = uniqueEmails.filter((email) => email !== primaryEmail);
   ```

5. **Variable Naming**: Use generic names that reflect collecting all values
   - Use: `allEmails`, `allPhones`, `allLinks` (not `allAdditionalEmails`, `allAdditionalPhones`)
   - Use: `uniqueEmails`, `uniquePhones`, `uniqueLinks` (not with "Additional"/"Secondary" prefix)

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Development guidelines and best practices
