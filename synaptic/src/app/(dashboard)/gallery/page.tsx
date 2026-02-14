'use client';

/**
 * Gallery Page – User's room library
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import Header from '@/components/layout/Header';
import RoomCard from '@/components/ui/RoomCard';
import { getRoomsByUser, deleteRoom } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import type { MemoryRoom } from '@/types/room';

export default function GalleryPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<MemoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.id) loadRooms();
  }, [user?.id]);

  async function loadRooms() {
    try {
      const data = await getRoomsByUser(user?.id || 'anonymous');
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this memory room? This cannot be undone.')) return;
    await deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = rooms.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="mx-auto max-w-6xl px-6 pt-28">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Memory Rooms</h1>
            <p className="text-sm text-white/40 mt-1">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/create" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> Create New
          </Link>
        </div>

        {/* Search */}
        {rooms.length > 0 && (
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms…"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50"
            />
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-0 overflow-hidden">
                <div className="aspect-video shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-2/3 rounded shimmer" />
                  <div className="h-3 w-full rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((room) => (
              <RoomCard key={room.id} room={room} onDelete={handleDelete} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No rooms yet</h2>
            <p className="text-sm text-white/40 mb-6">
              Create your first memory room to get started
            </p>
            <Link href="/create" className="btn-primary inline-flex items-center gap-2">
              Create Your First Room
            </Link>
          </div>
        ) : (
          <p className="text-center text-white/40 py-12">No rooms match &ldquo;{search}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
