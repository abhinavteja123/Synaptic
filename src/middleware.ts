/**
 * middleware.ts – Next.js Edge Middleware
 * Protects dashboard routes behind JWT authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedPaths = ['/create', '/gallery'];
const AUTH_COOKIE = 'synaptic-token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get(AUTH_COOKIE)?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify JWT using jose (Edge-compatible)
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'synaptic-dev-secret-change-in-production'
      );
      await jwtVerify(token, secret);
    } catch {
      // Invalid or expired token — redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear the bad cookie
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/create/:path*', '/gallery/:path*'],
};
