import type { ErrorComponentProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-4xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">Something went wrong</p>
        <pre className="bg-muted p-4 rounded-lg text-left text-sm overflow-auto">
          {error.message}
        </pre>
        <Link to="/" className="inline-block text-primary hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}

