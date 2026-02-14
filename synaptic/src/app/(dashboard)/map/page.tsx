'use client';

/**
 * Memory Map Page – Interactive world map showing where memories happened
 * Uses Leaflet (free, no API key) with OpenStreetMap tiles
 * URL: /map
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MapPin, ArrowLeft, Camera, Globe, Navigation, Compass, X, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { getRoomsByUser } from '@/lib/db';
import { ROOM_THEMES } from '@/lib/constants';
import type { MemoryRoom } from '@/types/room';

// Well-known city coordinates for geocoding without an API
const KNOWN_LOCATIONS: Record<string, [number, number]> = {
  'paris': [48.8566, 2.3522],
  'london': [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'tokyo': [35.6762, 139.6503],
  'rome': [41.9028, 12.4964],
  'dubai': [25.2048, 55.2708],
  'sydney': [-33.8688, 151.2093],
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.7041, 77.1025],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'jaipur': [26.9124, 75.7873],
  'ahmedabad': [23.0225, 72.5714],
  'goa': [15.2993, 74.1240],
  'berlin': [52.5200, 13.4050],
  'amsterdam': [52.3676, 4.9041],
  'barcelona': [41.3874, 2.1686],
  'istanbul': [41.0082, 28.9784],
  'singapore': [1.3521, 103.8198],
  'bangkok': [13.7563, 100.5018],
  'seoul': [37.5665, 126.9780],
  'beijing': [39.9042, 116.4074],
  'shanghai': [31.2304, 121.4737],
  'hong kong': [22.3193, 114.1694],
  'taipei': [25.0330, 121.5654],
  'moscow': [55.7558, 37.6173],
  'cairo': [30.0444, 31.2357],
  'cape town': [-33.9249, 18.4241],
  'nairobi': [-1.2921, 36.8219],
  'rio de janeiro': [-22.9068, -43.1729],
  'buenos aires': [-34.6037, -58.3816],
  'mexico city': [19.4326, -99.1332],
  'toronto': [43.6532, -79.3832],
  'vancouver': [49.2827, -123.1207],
  'los angeles': [34.0522, -118.2437],
  'san francisco': [37.7749, -122.4194],
  'chicago': [41.8781, -87.6298],
  'miami': [25.7617, -80.1918],
  'seattle': [47.6062, -122.3321],
  'las vegas': [36.1699, -115.1398],
  'washington': [38.9072, -77.0369],
  'boston': [42.3601, -71.0589],
  'lisbon': [38.7223, -9.1393],
  'prague': [50.0755, 14.4378],
  'vienna': [48.2082, 16.3738],
  'zurich': [47.3769, 8.5417],
  'athens': [37.9838, 23.7275],
  'dublin': [53.3498, -6.2603],
  'edinburgh': [55.9533, -3.1883],
  'stockholm': [59.3293, 18.0686],
  'oslo': [59.9139, 10.7522],
  'copenhagen': [55.6761, 12.5683],
  'helsinki': [60.1699, 24.9384],
  'warsaw': [52.2297, 21.0122],
  'budapest': [47.4979, 19.0402],
  'marrakech': [31.6295, -7.9811],
  'bali': [-8.3405, 115.0920],
  'maldives': [3.2028, 73.2207],
  'santorini': [36.3932, 25.4615],
  'maui': [20.7984, -156.3319],
  'hawaii': [19.8968, -155.5828],
  'phuket': [7.8804, 98.3923],
  'kyoto': [35.0116, 135.7681],
  'florence': [43.7696, 11.2558],
  'venice': [45.4408, 12.3155],
  'milan': [45.4642, 9.1900],
  'madrid': [40.4168, -3.7038],
  'seville': [37.3891, -5.9845],
  'nice': [43.7102, 7.2620],
  'monaco': [43.7384, 7.4246],
  'petra': [30.3285, 35.4444],
  'agra': [27.1767, 78.0081],
  'varanasi': [25.3176, 83.0068],
  'manali': [32.2432, 77.1892],
  'shimla': [31.1048, 77.1734],
  'mussoorie': [30.4598, 78.0644],
  'ooty': [11.4102, 76.6950],
  'munnar': [10.0889, 77.0595],
  'rishikesh': [30.0869, 78.2676],
  'leh': [34.1526, 77.5771],
  'ladakh': [34.1526, 77.5771],
  'udaipur': [24.5854, 73.7125],
  'kochi': [9.9312, 76.2673],
  'darjeeling': [27.0410, 88.2663],
};

function getCoordinates(location: string): [number, number] | null {
  const lower = location.toLowerCase().trim();
  // Exact match
  if (KNOWN_LOCATIONS[lower]) return KNOWN_LOCATIONS[lower];
  // Partial match (e.g. "Paris, France" → match "paris")
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  return null;
}

// Accent colors for locations
const locationColors = [
  { bg: 'bg-purple-500/15', border: 'border-purple-400/30', text: 'text-purple-300', dot: 'bg-purple-400', accent: '#a78bfa', marker: '#a78bfa' },
  { bg: 'bg-pink-500/15', border: 'border-pink-400/30', text: 'text-pink-300', dot: 'bg-pink-400', accent: '#f472b6', marker: '#f472b6' },
  { bg: 'bg-amber-500/15', border: 'border-amber-400/30', text: 'text-amber-300', dot: 'bg-amber-400', accent: '#fbbf24', marker: '#fbbf24' },
  { bg: 'bg-teal-500/15', border: 'border-teal-400/30', text: 'text-teal-300', dot: 'bg-teal-400', accent: '#2dd4bf', marker: '#2dd4bf' },
  { bg: 'bg-blue-500/15', border: 'border-blue-400/30', text: 'text-blue-300', dot: 'bg-blue-400', accent: '#60a5fa', marker: '#60a5fa' },
  { bg: 'bg-rose-500/15', border: 'border-rose-400/30', text: 'text-rose-300', dot: 'bg-rose-400', accent: '#fb7185', marker: '#fb7185' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-400/30', text: 'text-emerald-300', dot: 'bg-emerald-400', accent: '#34d399', marker: '#34d399' },
  { bg: 'bg-indigo-500/15', border: 'border-indigo-400/30', text: 'text-indigo-300', dot: 'bg-indigo-400', accent: '#818cf8', marker: '#818cf8' },
];

// Dynamic import for Leaflet map to avoid SSR issues
const MapView = dynamic<{ markers: MapMarker[]; selectedLocation: string | null; onMarkerClick: (location: string) => void }>(
  () => import('@/components/ui/MapView').then(mod => mod.default) as any,
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
        <div className="text-center">
          <Globe className="h-8 w-8 text-white/10 mx-auto mb-2 animate-pulse" />
          <p className="text-xs text-white/30">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export interface MapMarker {
  id: string;
  location: string;
  coords: [number, number];
  rooms: MemoryRoom[];
  color: string;
  photoCount: number;
}

export default function MemoryMapPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<MemoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    loadRooms();
  }, [isLoggedIn, user?.id]);

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

  // Group rooms by location
  const locationGroups = useMemo(() => {
    const groups: Record<string, MemoryRoom[]> = {};
    rooms.forEach(room => {
      const loc = room.location?.trim() || 'Unknown';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(room);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [rooms]);

  const locationsWithData = locationGroups.filter(([loc]) => loc !== 'Unknown');
  const unknownRooms = locationGroups.find(([loc]) => loc === 'Unknown')?.[1] || [];
  const totalLocations = locationsWithData.length;
  const totalPhotos = rooms.reduce((s, r) => s + (r.photos?.length || 0), 0);

  // Build map markers from known locations
  const markers: MapMarker[] = useMemo(() => {
    return locationsWithData
      .map(([location, locRooms], idx) => {
        const coords = getCoordinates(location);
        if (!coords) return null;
        const color = locationColors[idx % locationColors.length];
        return {
          id: location,
          location,
          coords,
          rooms: locRooms,
          color: color.marker,
          photoCount: locRooms.reduce((s, r) => s + (r.photos?.length || 0), 0),
        };
      })
      .filter(Boolean) as MapMarker[];
  }, [locationsWithData]);

  const handleMarkerClick = useCallback((location: string) => {
    setSelectedLocation(prev => prev === location ? null : location);
  }, []);

  const filteredRooms = selectedLocation
    ? rooms.filter(r => (r.location?.trim() || 'Unknown') === selectedLocation)
    : [];

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="mx-auto max-w-6xl px-6 pt-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="text-white/40 hover:text-white transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Memory Map</h1>
        </div>
        <p className="text-sm text-white/40 mb-6 ml-8">
          {totalLocations} location{totalLocations !== 1 ? 's' : ''} · {rooms.length} memor{rooms.length !== 1 ? 'ies' : 'y'} · {totalPhotos} photos
        </p>

        {loading ? (
          <div className="space-y-4">
            <div className="rounded-2xl shimmer h-[400px]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <div key={i} className="rounded-xl shimmer h-36" />)}
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-24">
            <Globe className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2 text-white/60">No memories yet</h2>
            <p className="text-sm text-white/30 mb-6">Create rooms with locations to see them on your map</p>
            <Link href="/create" className="btn-primary inline-flex items-center gap-2 text-sm">
              Create Memory
            </Link>
          </div>
        ) : (
          <>
            {/* Interactive Map */}
            {markers.length > 0 && (
              <div className="mb-8 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-purple-500/5">
                <MapView
                  markers={markers}
                  selectedLocation={selectedLocation}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            )}

            {/* Stats Bar */}
            <div className="flex items-center gap-6 mb-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-bold">{totalLocations}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Places</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/15 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-lg font-bold">{totalPhotos}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Photos</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-lg font-bold">{rooms.length}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Memories</p>
                </div>
              </div>
            </div>

            {/* Location Cards Grid */}
            <h2 className="text-lg font-semibold mb-4">Your Places</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {locationsWithData.map(([location, locRooms], idx) => {
                const color = locationColors[idx % locationColors.length];
                const photoCount = locRooms.reduce((s, r) => s + (r.photos?.length || 0), 0);
                const latestRoom = locRooms.sort((a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];
                const thumb = latestRoom.photos?.[0]?.url;
                const isSelected = selectedLocation === location;
                const hasCoords = !!getCoordinates(location);

                return (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(isSelected ? null : location)}
                    className={`group relative text-left rounded-xl border transition-all overflow-hidden ${
                      isSelected
                        ? `${color.bg} ${color.border} ring-1 ring-opacity-30 scale-[1.02]`
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                    style={isSelected ? { '--tw-ring-color': color.accent } as React.CSSProperties : undefined}
                  >
                    {/* Photo collage bg */}
                    <div className="relative h-24 overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/[0.03] to-transparent" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Location pin + coords badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full ${color.bg} border ${color.border} flex items-center justify-center`}>
                          <MapPin className={`h-3 w-3 ${color.text}`} />
                        </div>
                        {hasCoords && (
                          <span className="text-[9px] bg-black/40 backdrop-blur px-1.5 py-0.5 rounded text-white/40">
                            on map
                          </span>
                        )}
                      </div>

                      {/* Mini photo previews */}
                      <div className="absolute bottom-2 right-2 flex -space-x-2">
                        {locRooms.slice(0, 3).map(r => {
                          const p = r.photos?.[0]?.url;
                          return p ? (
                            <div key={r.id} className="w-7 h-7 rounded-full border-2 border-black/50 overflow-hidden">
                              <img src={p} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : null;
                        })}
                        {locRooms.length > 3 && (
                          <div className="w-7 h-7 rounded-full border-2 border-black/50 bg-white/10 flex items-center justify-center text-[9px] text-white/50">
                            +{locRooms.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className={`text-sm font-semibold truncate ${isSelected ? color.text : 'text-white/80'}`}>
                        {location}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30">
                        <span>{locRooms.length} memor{locRooms.length !== 1 ? 'ies' : 'y'}</span>
                        <span>·</span>
                        <span>{photoCount} photos</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Unknown location card */}
              {unknownRooms.length > 0 && (
                <button
                  onClick={() => setSelectedLocation(selectedLocation === 'Unknown' ? null : 'Unknown')}
                  className={`group text-left rounded-xl border transition-all p-4 ${
                    selectedLocation === 'Unknown'
                      ? 'bg-white/[0.06] border-white/20'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="h-4 w-4 text-white/25" />
                    <h3 className="text-sm font-medium text-white/40">No location set</h3>
                  </div>
                  <p className="text-[11px] text-white/25">{unknownRooms.length} room{unknownRooms.length !== 1 ? 's' : ''}</p>
                </button>
              )}
            </div>

            {/* Selected Location Rooms */}
            {selectedLocation && filteredRooms.length > 0 && (
              <div className="animate-fade-in mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-400" />
                    {selectedLocation === 'Unknown' ? 'No Location' : selectedLocation}
                    <span className="text-sm font-normal text-white/30">({filteredRooms.length})</span>
                  </h2>
                  <button onClick={() => setSelectedLocation(null)} className="text-white/30 hover:text-white transition p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredRooms.map(room => {
                    const theme = ROOM_THEMES[room.theme || 'valentine'];
                    const thumb = room.photos?.[0]?.url;
                    return (
                      <Link
                        key={room.id}
                        href={`/room/${room.id}`}
                        className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-all group"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10">
                              <Camera className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium truncate group-hover:text-purple-300 transition-colors">
                            {theme?.emoji} {room.title}
                          </h3>
                          <p className="text-xs text-white/30 line-clamp-1 mt-0.5">{room.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] text-white/20">
                              {new Date(room.createdAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })} · {room.photos?.length || 0} photos
                            </p>
                            <ExternalLink className="h-3 w-3 text-white/15 group-hover:text-purple-400 transition-colors" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No locations hint */}
            {totalLocations === 0 && (
              <div className="text-center py-16">
                <MapPin className="h-10 w-10 text-white/10 mx-auto mb-4" />
                <h2 className="text-lg font-medium mb-2 text-white/50">No locations yet</h2>
                <p className="text-sm text-white/30 mb-2">Add a location when creating rooms to populate your memory map.</p>
                <p className="text-xs text-white/20">You have {unknownRooms.length} room{unknownRooms.length !== 1 ? 's' : ''} without a location.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
