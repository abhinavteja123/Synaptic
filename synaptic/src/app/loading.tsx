'use client';

/**
 * loading.tsx – Root-level loading skeleton
 */

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a1a]">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-sm text-white/40 animate-pulse">Loading…</p>
      </div>
    </div>
  );
}
