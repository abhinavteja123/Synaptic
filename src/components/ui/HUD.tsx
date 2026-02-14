'use client';

/**
 * HUD.tsx – Heads-up display overlay for 3D room
 * Shows controls hint, connection status, and room info
 */

import { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff, X, Mouse } from 'lucide-react';

interface HUDProps {
  roomTitle: string;
  playerCount: number;
  isConnected: boolean;
  onBackClick?: () => void;
}

export default function HUD({ roomTitle, playerCount, isConnected, onBackClick }: HUDProps) {
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls hint after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        {/* Connection status */}
        <div className="glass-dark rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400" />
          )}
          <Users className="h-4 w-4 text-white/50" />
          <span className="text-white/70">{playerCount}</span>
        </div>

        {/* Back button */}
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="glass-dark rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Exit Room
          </button>
        )}
      </div>

      {/* Room title */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="glass-dark rounded-xl px-4 py-2">
          <p className="text-sm font-medium text-white/80">{roomTitle}</p>
        </div>
      </div>

      {/* Controls hint */}
      {showControls && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="glass-card max-w-sm text-center relative">
            <button
              onClick={() => setShowControls(false)}
              className="absolute top-3 right-3 text-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <Mouse className="mx-auto h-8 w-8 text-primary-400 mb-3" />
            <h3 className="font-semibold mb-3">Controls</h3>
            <div className="text-sm text-white/60 space-y-2">
              <p><strong className="text-white/80">Left-click + drag</strong> to rotate view</p>
              <p><strong className="text-white/80">Scroll</strong> to zoom in / out</p>
              <p><strong className="text-white/80">Right-click + drag</strong> to pan</p>
              <p><strong className="text-white/80">Click photos</strong> to view full-screen</p>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="btn-primary mt-4 text-sm px-6 py-2"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
