'use client';

/**
 * Shareable Greeting Card Page
 * Renders a beautiful digital greeting card from a memory room
 * URL: /room/[id]/card
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRoomById } from '@/lib/db';
import { ROOM_THEMES } from '@/lib/constants';
import type { MemoryRoom } from '@/types/room';

export default function GreetingCardPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [room, setRoom] = useState<MemoryRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRoomById(roomId);
        if (!data) { router.push('/gallery'); return; }
        setRoom(data);
      } catch { } finally { setLoading(false); }
    }
    if (roomId) load();
  }, [roomId, router]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomId}/card`;
    navigator.clipboard.writeText(url).catch(() => prompt('Share this card link:', url));
    alert('Card link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <div className="spinner" />
      </div>
    );
  }
  if (!room) return null;

  const theme = ROOM_THEMES[room.theme || 'valentine'] || ROOM_THEMES.valentine;
  const photos = room.photos || [];
  const mainPhoto = photos[0]?.url;
  const secondPhoto = photos[1]?.url;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: `linear-gradient(160deg, ${theme.floor} 0%, #0a0a1a 50%, ${theme.wall} 100%)` }}>
      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(160deg, ${theme.wall}ee 0%, #0f0f20ee 50%, ${theme.floor}ee 100%)`,
          border: `1px solid ${theme.accent}40`,
        }}
      >
        {/* Top accent line */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, ${theme.accentLight}, ${theme.accent}, transparent)` }} />

        {/* Photo collage area */}
        <div className="relative h-64 overflow-hidden">
          {mainPhoto ? (
            <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `${theme.accent}10` }}>
              <span className="text-6xl">{theme.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f20] via-transparent to-transparent" />

          {/* Overlay photo (small circle) */}
          {secondPhoto && (
            <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full overflow-hidden border-2 shadow-lg" style={{ borderColor: theme.accent }}>
              <img src={secondPhoto} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Emoji badge */}
          <div className="absolute top-4 left-4 text-4xl drop-shadow-lg">{theme.emoji}</div>
        </div>

        {/* Card content */}
        <div className="p-8 text-center">
          <h1 className="text-2xl font-light text-white/90 tracking-wide mb-2" style={{ textShadow: `0 0 30px ${theme.accent}40` }}>
            {room.title}
          </h1>

          <div className="w-16 h-px mx-auto my-4" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />

          <p className="text-white/60 text-sm italic leading-relaxed mb-4 max-w-xs mx-auto">
            &ldquo;{room.description}&rdquo;
          </p>

          {/* Photo captions as quotes */}
          {photos.slice(0, 3).filter(p => p.caption).map((photo, i) => (
            <p key={i} className="text-white/40 text-xs italic mb-1">
              {photo.caption}
            </p>
          ))}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: theme.accentLight }}>
            <span>{theme.emoji}</span>
            <span>Made with Synaptic</span>
            <span>{theme.emoji}</span>
          </div>

          {/* Photo count */}
          <p className="text-white/20 text-[10px] mt-2">
            {photos.length} {photos.length === 1 ? 'memory' : 'memories'} · {room.tags.join(' · ') || 'A special moment'}
          </p>
        </div>

        {/* Bottom accent */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, ${theme.accentLight}, ${theme.accent}, transparent)` }} />
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={() => router.push(`/room/${roomId}`)}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: `${theme.accent}25`, border: `1px solid ${theme.accent}40`, color: theme.accentLight }}
        >
          ✨ Enter Memory Room
        </button>
        <button
          onClick={handleCopyLink}
          className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white/70 text-sm hover:bg-white/15 hover:text-white transition-all"
        >
          🔗 Copy Card Link
        </button>
        <button
          onClick={() => router.push('/gallery')}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm hover:text-white/70 transition-all"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
