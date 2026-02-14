'use client';

/**
 * MapView – Interactive Leaflet map component for Memory Map
 * Renders markers for each location with custom colored pins
 * Must be loaded via next/dynamic with { ssr: false }
 */

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapMarker } from '@/app/(dashboard)/map/page';
import { Camera, MapPin } from 'lucide-react';

// Fix leaflet default marker icon path issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a custom colored marker icon using SVG
function createIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 40 : 32;
  const glow = isSelected ? `filter: drop-shadow(0 0 8px ${color}80);` : '';

  return L.divIcon({
    html: `
      <div style="width:${size}px;height:${size}px;${glow}transition:all 0.3s ease;">
        <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
          <path d="M12 0C5.372 0 0 5.372 0 12c0 9 12 24 12 24s12-15 12-24C24 5.372 18.628 0 12 0z" fill="${color}"/>
          <circle cx="12" cy="11" r="5" fill="white" fill-opacity="0.9"/>
          <circle cx="12" cy="11" r="2.5" fill="${color}"/>
        </svg>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [size, size * 1.2],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size],
  });
}

// Auto-fit bounds component
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].coords, 6, { animate: true });
    } else {
      const bounds = L.latLngBounds(markers.map(m => m.coords));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8, animate: true });
    }
  }, [markers, map]);

  return null;
}

// Fly to selected marker
function FlyToSelected({ markers, selectedLocation }: { markers: MapMarker[]; selectedLocation: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedLocation) return;
    const marker = markers.find(m => m.location === selectedLocation);
    if (marker) {
      map.flyTo(marker.coords, 8, { animate: true, duration: 1.2 });
    }
  }, [selectedLocation, markers, map]);

  return null;
}

interface MapViewProps {
  markers: MapMarker[];
  selectedLocation: string | null;
  onMarkerClick: (location: string) => void;
}

export default function MapView({ markers, selectedLocation, onMarkerClick }: MapViewProps) {
  // Default center (roughly center of world but biased towards populated areas)
  const defaultCenter: [number, number] = useMemo(() => {
    if (markers.length === 0) return [20, 0];
    if (markers.length === 1) return markers[0].coords;
    // Average of all markers
    const lat = markers.reduce((s, m) => s + m.coords[0], 0) / markers.length;
    const lng = markers.reduce((s, m) => s + m.coords[1], 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <div className="relative">
      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={markers.length === 1 ? 6 : 3}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-[400px] z-0"
        style={{ background: '#0a0a0f' }}
      >
        {/* Dark map tiles - CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds markers={markers} />
        <FlyToSelected markers={markers} selectedLocation={selectedLocation} />

        {/* Markers */}
        {markers.map((marker) => {
          const isSelected = selectedLocation === marker.location;
          const icon = createIcon(marker.color, isSelected);

          return (
            <Marker
              key={marker.id}
              position={marker.coords}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick(marker.location),
              }}
            >
              <Popup>
                <div className="min-w-[180px] p-1">
                  <h3 className="font-bold text-sm mb-1" style={{ color: marker.color }}>
                    📍 {marker.location}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {marker.rooms.length} memor{marker.rooms.length !== 1 ? 'ies' : 'y'} · {marker.photoCount} photos
                  </p>
                  <div className="mt-2 space-y-1">
                    {marker.rooms.slice(0, 3).map(room => (
                      <div key={room.id} className="flex items-center gap-1.5 text-xs">
                        <span>💜</span>
                        <span className="truncate max-w-[150px]">{room.title}</span>
                      </div>
                    ))}
                    {marker.rooms.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-5">
                        +{marker.rooms.length - 3} more...
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Overlay gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-10" />

      {/* Map legend */}
      <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
        <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Memory Pins</p>
        <div className="flex items-center gap-2">
          {markers.slice(0, 5).map((m, i) => (
            <div key={m.id} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
              <span className="text-[9px] text-white/40 max-w-[60px] truncate">{m.location}</span>
            </div>
          ))}
          {markers.length > 5 && (
            <span className="text-[9px] text-white/30">+{markers.length - 5}</span>
          )}
        </div>
      </div>

      {/* Custom CSS for leaflet in dark mode */}
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1a2e !important;
          color: #e0e0e0 !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: #1a1a2e !important;
          border: 1px solid rgba(255,255,255,0.1);
          border-top: none;
          border-left: none;
        }
        .leaflet-popup-close-button {
          color: rgba(255,255,255,0.4) !important;
        }
        .leaflet-popup-close-button:hover {
          color: white !important;
        }
        .leaflet-control-zoom a {
          background: #1a1a2e !important;
          color: rgba(255,255,255,0.6) !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #252540 !important;
          color: white !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
