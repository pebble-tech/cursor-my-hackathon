import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <Link to="/" className="inline-block text-primary hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}

