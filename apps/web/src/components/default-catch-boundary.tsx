import type { ErrorComponentProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-destructive text-4xl font-bold">Error</h1>
        <p className="text-muted-foreground">Something went wrong</p>
        <pre className="bg-muted overflow-auto rounded-lg p-4 text-left text-sm">{error.message}</pre>
        <Link to="/" className="text-primary inline-block hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
