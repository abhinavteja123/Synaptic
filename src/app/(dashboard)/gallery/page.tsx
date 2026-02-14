'use client';

/**
 * Gallery Page – User's room library
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, X, Save } from 'lucide-react';
import Header from '@/components/layout/Header';
import RoomCard from '@/components/ui/RoomCard';
import { getRoomsByUser, deleteRoom, saveRoom } from '@/lib/db';
import { useAuth } from '@/hooks/useAuth';
import type { MemoryRoom } from '@/types/room';
import { ROOM_THEMES } from '@/lib/constants';

export default function GalleryPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<MemoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editRoom, setEditRoom] = useState<MemoryRoom | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editTheme, setEditTheme] = useState('valentine');
  const [editPublic, setEditPublic] = useState(false);
  const [saving, setSaving] = useState(false);

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

  function openEdit(room: MemoryRoom) {
    setEditRoom(room);
    setEditTitle(room.title);
    setEditDesc(room.description);
    setEditTags(room.tags.join(', '));
    setEditTheme(room.theme || 'valentine');
    setEditPublic(room.isPublic);
  }

  async function handleSaveEdit() {
    if (!editRoom) return;
    setSaving(true);
    const updated: MemoryRoom = {
      ...editRoom,
      title: editTitle.trim() || editRoom.title,
      description: editDesc.trim(),
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      theme: editTheme,
      isPublic: editPublic,
    };
    await saveRoom(updated);
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditRoom(null);
    setSaving(false);
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
              <RoomCard key={room.id} room={room} onDelete={handleDelete} onEdit={openEdit} />
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

      {/* Edit Room Modal */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-dark rounded-2xl border border-white/10 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Edit Room</h2>
              <button onClick={() => setEditRoom(null)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* Title */}
            <label className="block text-xs text-white/40 mb-1">Title</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white mb-4 outline-none focus:border-purple-500/50"
            />

            {/* Description */}
            <label className="block text-xs text-white/40 mb-1">Description</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white mb-4 outline-none resize-none focus:border-purple-500/50"
            />

            {/* Tags */}
            <label className="block text-xs text-white/40 mb-1">Tags (comma-separated)</label>
            <input
              value={editTags}
              onChange={e => setEditTags(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white mb-4 outline-none focus:border-purple-500/50"
            />

            {/* Theme Picker */}
            <label className="block text-xs text-white/40 mb-2">Theme</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.entries(ROOM_THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setEditTheme(key)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs transition-all border ${
                    editTheme === key
                      ? 'border-white/30 bg-white/10'
                      : 'border-transparent bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span className="text-white/70">{t.name}</span>
                </button>
              ))}
            </div>

            {/* Visibility */}
            <label className="flex items-center gap-2 text-sm text-white/60 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={editPublic}
                onChange={e => setEditPublic(e.target.checked)}
                className="accent-purple-500"
              />
              Public room
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditRoom(null)}
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
