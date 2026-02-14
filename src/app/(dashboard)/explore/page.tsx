'use client';

/**
 * Explore Page – Browse public and demo rooms
 */

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import RoomCard from '@/components/ui/RoomCard';
import { getPublicRooms } from '@/lib/db';
import { DEMO_ROOMS } from '@/lib/demoRooms';
import type { MemoryRoom } from '@/types/room';

export default function ExplorePage() {
  const [userRooms, setUserRooms] = useState<MemoryRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicRooms()
      .then(setUserRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allRooms = [...DEMO_ROOMS, ...userRooms];

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="mx-auto max-w-6xl px-6 pt-28">
        <h1 className="text-2xl font-bold mb-2">Explore Memory Rooms</h1>
        <p className="text-sm text-white/40 mb-8">Step into other people&apos;s memories — or try the demo rooms</p>

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
        ) : (
          <>
            {/* Demo rooms */}
            <h2 className="text-lg font-semibold mb-4">Demo Rooms</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {DEMO_ROOMS.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>

            {/* User public rooms */}
            {userRooms.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-4">Community Rooms</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {userRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
