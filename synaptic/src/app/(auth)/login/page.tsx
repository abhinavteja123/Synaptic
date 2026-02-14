'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Brain, Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/gallery';
  const { signup, signin } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (name.trim().length < 2) {
          setError('Name must be at least 2 characters');
          setLoading(false);
          return;
        }

        const result = await signup(name, email, password);
        if (!result.success) {
          setError(result.error || 'Signup failed');
          setLoading(false);
          return;
        }
      } else {
        const result = await signin(email, password);
        if (!result.success) {
          setError(result.error || 'Signin failed');
          setLoading(false);
          return;
        }
      }

      // Redirect to callback URL or gallery on success
      router.push(callbackUrl);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/15 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card py-10 px-8">
          <Brain className="mx-auto h-12 w-12 text-primary-400 mb-4" />
          <h1 className="text-2xl font-bold text-center mb-1">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/50 text-sm text-center mb-8">
            {mode === 'signin'
              ? 'Sign in to your Synaptic account'
              : 'Join Synaptic to create memory rooms'}
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="block text-sm text-white/70 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm text-white/70 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm text-white/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password (signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm text-white/70 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-500 px-6 py-3.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loading
                ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                : (mode === 'signup' ? 'Create Account' : 'Sign In')
              }
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-white/50">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={switchMode} className="text-primary-400 hover:text-primary-300 font-medium">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={switchMode} className="text-primary-400 hover:text-primary-300 font-medium">
                  Sign In
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-xs text-white/30 text-center">
            Your data is stored locally in your browser.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
