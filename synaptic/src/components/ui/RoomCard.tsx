'use client';

/**
 * RoomCard.tsx – Card component for gallery display
 */

import Link from 'next/link';
import { Calendar, Globe, Lock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MemoryRoom } from '@/types/room';

interface RoomCardProps {
  room: MemoryRoom;
  onDelete?: (id: string) => void;
}

export default function RoomCard({ room, onDelete }: RoomCardProps) {
  const thumbnail =
    room.photos[0]?.url ||
    room.sceneData?.panoramaUrl ||
    null;

  return (
    <div className="glass-card group overflow-hidden p-0">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-white/[0.02] overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={room.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20 text-sm">
            No preview
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Quick actions on hover */}
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/room/${room.id}`}
            className="rounded-lg bg-primary-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500 transition"
          >
            Enter
          </Link>
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(room.id); }}
              className="rounded-lg bg-red-600/80 px-2 py-1.5 text-white/80 hover:text-white hover:bg-red-500 transition"
              aria-label="Delete room"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm truncate mb-1">{room.title}</h3>
        <p className="text-xs text-white/40 line-clamp-2 mb-3">{room.description}</p>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(room.createdAt), { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1">
            {room.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {room.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        {/* Tags */}
        {room.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {room.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] text-primary-300">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
