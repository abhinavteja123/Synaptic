'use client';

/**
 * not-found.tsx – 404 page
 */

import Link from 'next/link';
import { Home, Ghost } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <Ghost className="mx-auto h-16 w-16 text-white/20 mb-6" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-white/50 mb-8">This memory room doesn&apos;t exist… yet.</p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="h-4 w-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
