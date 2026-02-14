'use client';

/**
 * Auth Context & useAuth Hook
 * Provides authentication state throughout the app via React Context.
 * Handles signup, signin, signout, and session persistence.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, type UserRecord } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// ============================================
//  Types
// ============================================

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
//  Auth Provider
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // Not authenticated — that's fine
    } finally {
      setIsLoading(false);
    }
  }

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      // Check if email already exists in local Dexie DB
      const existing = await db.users.where('email').equalsIgnoreCase(email).first();
      if (existing) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Validate password
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Hash password client-side
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = nanoid();

      // Save user to Dexie
      const userRecord: UserRecord = {
        id: userId,
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        createdAt: new Date(),
      };
      await db.users.put(userRecord);

      // Call API to get JWT cookie
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    try {
      // Find user in Dexie
      const userRecord = await db.users.where('email').equalsIgnoreCase(email).first();
      if (!userRecord) {
        return { success: false, error: 'No account found with this email' };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, userRecord.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Incorrect password' };
      }

      // Call API to get JWT cookie
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signin failed' };
      }

      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // Clear locally regardless
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        signup,
        signin,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
//  Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
