/**
 * JWT Authentication Utilities
 * Simple email/password auth with JWT tokens stored in httpOnly cookies.
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// ============================================
//  Constants
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || 'synaptic-dev-secret-change-in-production';
const TOKEN_COOKIE = 'synaptic-token';
const TOKEN_EXPIRY = '7d'; // 7 days
const SALT_ROUNDS = 10;

// ============================================
//  Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// ============================================
//  Password Utilities
// ============================================

/** Hash a password using bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare a plain password against a hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
//  JWT Utilities
// ============================================

/** Create a signed JWT for a user */
export function createToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/** Verify and decode a JWT. Returns null if invalid/expired. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ============================================
//  Cookie Helpers (Server Components / Route Handlers)
// ============================================

/** Set the auth token as an httpOnly cookie */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/** Remove the auth cookie (logout) */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
}

/** Read and verify the current user from cookies. Returns null if not authenticated. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return { id: payload.id, email: payload.email, name: payload.name };
}

/** The cookie name, exported for middleware */
export const AUTH_COOKIE_NAME = TOKEN_COOKIE;

/** The JWT secret, exported for edge-compatible verification */
export const JWT_SECRET_VALUE = JWT_SECRET;
