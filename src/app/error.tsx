'use client';

/**
 * error.tsx – App-level error page
 */

import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card max-w-md text-center">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-white/50 mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary inline-flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
          <Link href="/" className="btn-secondary inline-flex items-center gap-2 text-sm">
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
