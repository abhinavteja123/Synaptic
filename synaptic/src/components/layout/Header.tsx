'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isLoggedIn, signout } = useAuth();
  const router = useRouter();

  const handleSignout = async () => {
    await signout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Brain className="h-7 w-7 text-primary-400" />
          <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Synaptic
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/explore" className="text-sm text-white/70 hover:text-white transition-colors">
            Explore
          </Link>
          {isLoggedIn && (
            <Link href="/gallery" className="text-sm text-white/70 hover:text-white transition-colors">
              My Rooms
            </Link>
          )}
          {isLoggedIn && (
            <Link href="/create" className="btn-primary text-sm">
              + New Memory
            </Link>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-3 ml-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <User className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-white/80">{user?.name}</span>
              </div>
              <button
                onClick={handleSignout}
                className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden glass-dark border-t border-white/10 px-6 py-4 space-y-3 animate-fade-in">
          <Link href="/explore" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
            Explore
          </Link>
          {isLoggedIn && (
            <Link href="/gallery" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
              My Rooms
            </Link>
          )}
          {isLoggedIn && (
            <Link href="/create" className="block text-sm text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>
              Create
            </Link>
          )}
          {isLoggedIn ? (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-sm text-white/60">{user?.name}</span>
              <button
                onClick={() => { handleSignout(); setMenuOpen(false); }}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="block text-sm text-primary-400 hover:text-primary-300 font-medium" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
