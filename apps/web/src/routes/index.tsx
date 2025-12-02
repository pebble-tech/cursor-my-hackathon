import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-6xl font-bold">Base Template</h1>
          <p className="text-muted-foreground text-xl">TanStack Start + Better Auth + Drizzle ORM + Tailwind v4</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-card space-y-2 rounded-lg border p-6">
            <h3 className="font-semibold">Features</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>TanStack Start (React Router SSR)</li>
              <li>Better Auth with Google OAuth</li>
              <li>Drizzle ORM + PostgreSQL</li>
              <li>Tailwind CSS v4</li>
              <li>Shadcn UI Components</li>
              <li>AI SDK v5 via AI Gateway</li>
            </ul>
          </div>
          <div className="bg-card space-y-2 rounded-lg border p-6">
            <h3 className="font-semibold">Quick Start</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>1. Copy .env.example to .env</li>
              <li>2. Set up PostgreSQL database</li>
              <li>3. Run: pnpm install</li>
              <li>4. Run: pnpm db:push</li>
              <li>5. Run: pnpm dev:app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
