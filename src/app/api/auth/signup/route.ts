/**
 * POST /api/auth/signup
 * Creates a JWT token for a new user.
 * The client saves the user to Supabase first, then calls this to mint a JWT
 * with the SAME user ID so the FK constraint is satisfied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email } = body as { id?: string; name?: string; email?: string };

    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'User ID, name, and email are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Use the same user ID that was saved to Supabase
    const token = createToken({ id, email: email.toLowerCase(), name: name.trim() });

    // Set httpOnly cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id, email: email.toLowerCase(), name: name.trim() },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
