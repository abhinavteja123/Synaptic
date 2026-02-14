/**
 * POST /api/auth/signup
 * Creates a JWT token for a new user.
 * Client is responsible for storing user data in Dexie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createToken, setAuthCookie } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body as { name?: string; email?: string };

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    // Generate user ID and create JWT
    const userId = nanoid();
    const token = createToken({ id: userId, email: email.toLowerCase(), name: name.trim() });

    // Set httpOnly cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name: name.trim() },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
