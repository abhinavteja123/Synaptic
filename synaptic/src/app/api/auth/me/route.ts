/**
 * GET /api/auth/me
 * Returns the current authenticated user from the JWT cookie.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/** Force dynamic – cookies are only available at request time */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
