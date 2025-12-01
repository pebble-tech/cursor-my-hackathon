# Base Template

A modern, production-ready full-stack monorepo template built with the latest technologies.

## Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TanStack Start** - Type-safe full-stack React framework with SSR
- **TanStack Query** - Powerful data synchronization for React
- **Tailwind CSS v4** - Utility-first CSS framework
- **Shadcn UI** - Beautiful, accessible component library

### Backend
- **Better Auth** - Simple, powerful authentication with Google OAuth
- **Drizzle ORM** - TypeScript-first ORM for PostgreSQL
- **PostgreSQL** - Reliable, powerful relational database
- **AI SDK v5** - Unified AI provider interface via AI Gateway

### Developer Experience
- **PNPM** - Fast, efficient package manager
- **TypeScript** - Type safety across the stack
- **Vite** - Lightning-fast build tool
- **Oxlint** - Fast linting

## Project Structure

```
base/
├── apps/
│   └── web/              # Main web application
├── packages/
│   ├── core/             # Backend logic & utilities
│   └── ui/               # Shared UI components
└── docs/                 # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- PNPM 9+
- PostgreSQL 14+

### Setup

1. **Clone and install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following content:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/base_db
   
   # AI Gateway
   AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here
   
   # App
   APP_BASE_URL=http://localhost:3000
   SESSION_SECRET=your_session_secret_min_16_chars
   
   # Better Auth - Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Set up the database**
   ```bash
   # Push schema to database
   pnpm db:push
   
   # Or run migrations
   pnpm db:migrate
   ```

4. **Start development server**
   ```bash
   pnpm dev:app
   ```

   Visit http://localhost:3000

### Development Commands

```bash
# Development
pnpm dev:app          # Start web app
pnpm dev:core         # Watch core package
pnpm storybook        # UI component preview

# Database
pnpm db:push          # Push schema changes
pnpm db:generate      # Generate migration
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Build & Deploy
pnpm build            # Build all packages
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
pnpm preview          # Preview production build

# UI Components
pnpm ui:add [component]  # Add Shadcn component
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/base_db

# AI Gateway
AI_GATEWAY_API_KEY=your_ai_gateway_api_key

# App
APP_BASE_URL=http://localhost:3000
SESSION_SECRET=your_session_secret_min_16_chars

# Better Auth - Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Key Features

### 🔐 Authentication
- Better Auth with Google OAuth integration
- Session management
- Type-safe user context

### 🗄️ Database
- Drizzle ORM with PostgreSQL
- Type-safe queries
- Migration system
- Studio UI for database management

### 🎨 UI Components
- Shadcn UI components
- Tailwind v4 with CSS variables
- Dark mode support
- Responsive design

### 🤖 AI Integration
- AI SDK v5 with AI Gateway
- Multiple provider support (OpenAI, Google)
- Type-safe AI function calls

### 📦 Monorepo Structure
- PNPM workspaces
- Shared TypeScript configuration
- Path aliases for clean imports
- Efficient dependency management

## Architecture

### Server Functions
Use for app-internal operations:
- RPC-style calls from components
- Access request context
- Set cookies/headers
- Database operations

Example:
```typescript
// apps/web/src/apis/example.ts
export const fetchData = createServerFn({ method: 'GET' }).handler(async () => {
  return { data: 'Hello' };
});
```

### Server Routes
Use for external integrations:
- Stable public URLs
- Webhook endpoints
- Cron job handlers

Example:
```typescript
// apps/web/src/routes/api.example.ts
export const ServerRoute = createServerFileRoute('/api/example').methods({
  GET: async () => Response.json({ ok: true }),
});
```

## Best Practices

1. **Use path aliases**: Import using `~/` for package-local imports
2. **Server functions for UI**: Use `createServerFn` for UI-triggered operations
3. **Server routes for webhooks**: Use server routes for external callers
4. **Type safety**: Leverage TypeScript strictly across the stack
5. **Logging**: Use `logging.ts` utils instead of console.log
6. **Database**: Generate migrations with `pnpm db:generate`

## Documentation

See [docs/README.md](./docs/README.md) for detailed documentation.

## License

MIT

