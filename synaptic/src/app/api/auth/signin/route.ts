/**
 * POST /api/auth/signin
 * Verifies credentials and returns a JWT token.
 * Password verification happens client-side (Dexie.js),
 * this route just mints the token for a verified user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name } = body as { id?: string; email?: string; name?: string };

    if (!id || !email || !name) {
      return NextResponse.json(
        { error: 'User ID, email, and name are required' },
        { status: 400 }
      );
    }

    // Create JWT and set cookie
    const token = createToken({ id, email: email.toLowerCase(), name });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id, email: email.toLowerCase(), name },
    });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
