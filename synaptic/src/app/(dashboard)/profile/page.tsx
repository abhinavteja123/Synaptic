'use client';

/**
 * Profile Page – User's personal profile with stats and mood journal
 * URL: /profile
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Camera, Calendar, Heart, Sparkles, ArrowLeft, Edit2, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { getRoomsByUser, db } from '@/lib/db';
import { ROOM_THEMES } from '@/lib/constants';
import type { MemoryRoom } from '@/types/room';

export default function ProfilePage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<MemoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    loadData();
  }, [isLoggedIn, user?.id]);

  async function loadData() {
    try {
      const userRooms = await getRoomsByUser(user?.id || 'anonymous');
      setRooms(userRooms);
      // Load bio from local storage
      const savedBio = localStorage.getItem(`synaptic-bio-${user?.id}`);
      if (savedBio) setBio(savedBio);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!user || !nameDraft.trim()) return;
    try {
      await db.users.where('id').equals(user.id).modify({ name: nameDraft.trim() });
      // Reload page to reflect in auth
      window.location.reload();
    } catch (err) {
      console.error('Failed to update name:', err);
    }
  }

  function handleSaveBio() {
    if (!user) return;
    localStorage.setItem(`synaptic-bio-${user.id}`, bioDraft);
    setBio(bioDraft);
    setEditingBio(false);
  }

  // Compute stats
  const totalPhotos = rooms.reduce((sum, r) => sum + (r.photos?.length || 0), 0);
  const totalVisits = rooms.reduce((sum, r) => sum + (r.visitCount || 0), 0);
  const themeUsage = rooms.reduce((acc, r) => {
    const t = r.theme || 'valentine';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const favoriteTheme = Object.entries(themeUsage).sort(([, a], [, b]) => b - a)[0];
  const moodJournal = rooms
    .filter(r => r.entryMood || r.exitMood)
    .map(r => ({
      title: r.title,
      theme: r.theme || 'valentine',
      entryMood: r.entryMood,
      exitMood: r.exitMood,
      date: r.updatedAt,
    }));

  const memberSince = user ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <div className="mx-auto max-w-4xl px-6 pt-28">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full shimmer" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded shimmer" />
              <div className="h-4 w-32 rounded shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="mx-auto max-w-4xl px-6 pt-28">
        {/* Back link */}
        <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Gallery
        </Link>

        {/* Profile Header */}
        <div className="glass-card p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-light text-white flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              <div className="flex items-center gap-2 mb-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                      autoFocus
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-lg font-semibold focus:outline-none focus:border-purple-400/60"
                    />
                    <button onClick={handleSaveName} className="text-green-400 hover:text-green-300"><Check className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-semibold text-white">{user?.name}</h1>
                    <button onClick={() => { setEditingName(true); setNameDraft(user?.name || ''); }} className="text-white/30 hover:text-white transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
              <p className="text-sm text-white/40">{user?.email}</p>
              <p className="text-xs text-white/25 mt-1">Member since {memberSince}</p>

              {/* Bio */}
              <div className="mt-3">
                {editingBio ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveBio(); } if (e.key === 'Escape') setEditingBio(false); }}
                      autoFocus
                      rows={2}
                      maxLength={200}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-purple-400/60 resize-none"
                      placeholder="Write a short bio..."
                    />
                    <button onClick={handleSaveBio} className="text-green-400 hover:text-green-300 mt-2"><Check className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <p
                    className="text-sm text-white/50 cursor-pointer hover:text-white/70 transition-colors"
                    onClick={() => { setEditingBio(true); setBioDraft(bio); }}
                    title="Click to edit bio"
                  >
                    {bio || <span className="text-white/25 italic">Click to add a bio...</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <Brain className="h-5 w-5 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-white">{rooms.length}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Rooms</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Camera className="h-5 w-5 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-white">{totalPhotos}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Photos</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Sparkles className="h-5 w-5 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-white">{totalVisits}</div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Visits</div>
          </div>
          <div className="glass-card p-4 text-center">
            <Heart className="h-5 w-5 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-light text-white flex items-center justify-center gap-1">
              {favoriteTheme ? (
                <>
                  <span className="text-lg">{ROOM_THEMES[favoriteTheme[0]]?.emoji}</span>
                </>
              ) : '—'}
            </div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">Fav Theme</div>
          </div>
        </div>

        {/* Mood Journal */}
        {moodJournal.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🧠</span> Mood Journal
            </h2>
            <div className="space-y-3">
              {moodJournal.map((entry, i) => {
                const moodEmojis: Record<string, string> = {
                  happy: '😊', loved: '🥰', calm: '😌', sad: '😢', thoughtful: '🤔', inspired: '✨',
                };
                return (
                  <div key={i} className="flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
                    <span className="text-lg">{ROOM_THEMES[entry.theme]?.emoji || '💝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{entry.title}</p>
                      <p className="text-xs text-white/30">{new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.entryMood && (
                        <div className="text-center">
                          <span className="text-lg">{moodEmojis[entry.entryMood] || '😐'}</span>
                          <p className="text-[9px] text-white/25">Before</p>
                        </div>
                      )}
                      {entry.entryMood && entry.exitMood && (
                        <span className="text-white/20 text-xs">→</span>
                      )}
                      {entry.exitMood && (
                        <div className="text-center">
                          <span className="text-lg">{moodEmojis[entry.exitMood] || '😐'}</span>
                          <p className="text-[9px] text-white/25">After</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Rooms */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent Rooms</h2>
          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.slice(0, 6).map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.id}`}
                  className="flex items-center gap-4 glass-card p-4 hover:bg-white/[0.06] transition-colors group"
                >
                  {room.photos[0]?.url ? (
                    <img src={room.photos[0].url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                      {ROOM_THEMES[room.theme || 'valentine']?.emoji || '💝'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">{room.title}</h3>
                    <p className="text-xs text-white/40 truncate">{room.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/25">{room.photos?.length || 0} photos</span>
                      <span className="text-[10px] text-white/15">·</span>
                      <span className="text-[10px] text-white/25">{room.visitCount || 0} visits</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">No rooms yet. <Link href="/create" className="text-purple-400 hover:text-purple-300">Create one!</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
