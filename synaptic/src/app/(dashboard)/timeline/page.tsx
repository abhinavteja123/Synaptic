'use client';

/**
 * Memory Timeline Page – Chronological visual timeline of all rooms
 * URL: /timeline
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, ArrowLeft, Heart, Camera, MapPin, Lock } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { getRoomsByUser } from '@/lib/db';
import { ROOM_THEMES } from '@/lib/constants';
import type { MemoryRoom } from '@/types/room';

const moodEmojis: Record<string, string> = {
  joyful: '☀️',
  content: '✨',
  neutral: '☁️',
  melancholic: '🌧',
  sad: '⛈',
};

export default function TimelinePage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<MemoryRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    loadRooms();
  }, [isLoggedIn, user?.id]);

  async function loadRooms() {
    try {
      const data = await getRoomsByUser(user?.id || 'anonymous');
      // Sort oldest first for timeline
      setRooms(data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group rooms by month/year
  const grouped = rooms.reduce((acc, room) => {
    const date = new Date(room.createdAt);
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(room);
    return acc;
  }, {} as Record<string, MemoryRoom[]>);

  const totalPhotos = rooms.reduce((s, r) => s + (r.photos?.length || 0), 0);

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="mx-auto max-w-3xl px-6 pt-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="text-white/40 hover:text-white transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Memory Timeline</h1>
        </div>
        <p className="text-sm text-white/40 mb-8 ml-8">
          {rooms.length} memories · {totalPhotos} photos
        </p>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="ml-8 space-y-3">
                <div className="h-5 w-32 rounded shimmer" />
                <div className="h-24 rounded-xl shimmer" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24">
            <Clock className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2 text-white/60">No memories yet</h2>
            <p className="text-sm text-white/30 mb-6">Create your first room to start your timeline</p>
            <Link href="/create" className="btn-primary inline-flex items-center gap-2 text-sm">
              Create Memory
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500/40 via-pink-500/30 to-purple-500/10" />

            {Object.entries(grouped).map(([monthYear, monthRooms]) => (
              <div key={monthYear} className="mb-10">
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center z-10">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">{monthYear}</h2>
                </div>

                {/* Room cards */}
                <div className="ml-8 space-y-3">
                  {monthRooms.map((room, idx) => {
                    const theme = ROOM_THEMES[room.theme || 'valentine'];
                    const thumb = room.photos?.[0]?.url;
                    const dayStr = new Date(room.createdAt).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                    const isLocked = room.lockedUntil && new Date(room.lockedUntil) > new Date();

                    return (
                      <Link
                        key={room.id}
                        href={isLocked ? '#' : `/room/${room.id}`}
                        className={`group block rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all overflow-hidden ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex gap-4 p-4">
                          {/* Thumbnail */}
                          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/[0.03]">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/10">
                                <Camera className="h-6 w-6" />
                              </div>
                            )}
                            {/* Theme badge */}
                            <div className="absolute top-1 left-1 text-xs">{theme?.emoji}</div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold truncate">{room.title}</h3>
                              {isLocked && <Lock className="h-3 w-3 text-amber-400/60" />}
                            </div>
                            <p className="text-xs text-white/35 line-clamp-1 mb-2">{room.description}</p>

                            <div className="flex items-center gap-3 text-[11px] text-white/30">
                              <span>{dayStr}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                {room.photos?.length || 0}
                              </span>
                              {room.location && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {room.location}
                                  </span>
                                </>
                              )}
                              {room.entryMood && (
                                <>
                                  <span>·</span>
                                  <span>{moodEmojis[room.entryMood] || '☁️'}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Mood color accent bar */}
                          <div
                            className="w-1 self-stretch rounded-full opacity-60"
                            style={{ background: theme?.accent || '#6366f1' }}
                          />
                        </div>

                        {/* Photo strip – show up to 4 mini thumbnails */}
                        {room.photos && room.photos.length > 1 && (
                          <div className="flex gap-0.5 px-4 pb-3">
                            {room.photos.slice(0, 5).map((photo, pi) => (
                              <div
                                key={photo.id}
                                className="h-8 flex-1 rounded overflow-hidden bg-white/[0.03]"
                              >
                                <img src={photo.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                              </div>
                            ))}
                            {room.photos.length > 5 && (
                              <div className="h-8 w-8 rounded bg-white/[0.05] flex items-center justify-center text-[10px] text-white/30 flex-shrink-0">
                                +{room.photos.length - 5}
                              </div>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* End marker */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center z-10">
                <Heart className="h-3.5 w-3.5 text-pink-400" />
              </div>
              <span className="text-xs text-white/30">The story continues…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
