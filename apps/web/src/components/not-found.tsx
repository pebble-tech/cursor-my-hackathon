import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-muted-foreground text-xl">Page not found</p>
        <Link to="/" className="text-primary inline-block hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
