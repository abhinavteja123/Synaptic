'use client';

/**
 * MoodIndicator.tsx – Clickable room mood with mood-selector popup
 */

import { useState, useRef, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudDrizzle, Sparkles } from 'lucide-react';
import type { Mood } from '@/types/scene';
import { MOOD_CONFIGS } from '@/lib/constants';

interface MoodIndicatorProps {
  mood: Mood;
  onMoodChange?: (mood: Mood) => void;
}

const MOODS: Mood[] = ['joyful', 'content', 'neutral', 'melancholic', 'sad'];

const moodIcons: Record<Mood, React.ElementType> = {
  joyful: Sun,
  content: Sparkles,
  neutral: Cloud,
  melancholic: CloudDrizzle,
  sad: CloudRain,
};

const moodEmojis: Record<Mood, string> = {
  joyful: '☀️',
  content: '✨',
  neutral: '☁️',
  melancholic: '🌧',
  sad: '⛈',
};

export default function MoodIndicator({ mood, onMoodChange }: MoodIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.neutral;
  const Icon = moodIcons[mood] || Cloud;

  // Pulse animation on mood change
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 700);
    return () => clearTimeout(t);
  }, [mood]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="fixed top-20 left-4 z-40" ref={panelRef}>
      {/* Main indicator (clickable) */}
      <button
        onClick={() => setOpen(!open)}
        className={`glass-dark rounded-xl px-4 py-3 flex items-center gap-3 min-w-[140px] transition-all hover:bg-white/[0.08] cursor-pointer border border-transparent hover:border-white/10 ${pulse ? 'scale-105' : 'scale-100'}`}
        style={{ transition: 'transform 0.3s ease, background 0.2s' }}
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20`, boxShadow: `0 0 12px ${config.color}30` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div className="text-left">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Room Mood</p>
          <p className="text-sm font-semibold" style={{ color: config.color }}>
            {config.label}
          </p>
        </div>
      </button>

      {/* Mood selector popup */}
      {open && (
        <div className="mt-2 glass-dark rounded-xl border border-white/10 p-2 animate-fade-in w-52">
          <p className="text-[10px] text-white/40 uppercase tracking-wider px-2 pb-1">Set Room Mood</p>
          {MOODS.map((m) => {
            const mc = MOOD_CONFIGS[m];
            const active = m === mood;
            return (
              <button
                key={m}
                onClick={() => {
                  onMoodChange?.(m);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                  active
                    ? 'bg-white/10 border border-white/10'
                    : 'hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <span className="text-lg">{moodEmojis[m]}</span>
                <span className="text-sm font-medium" style={{ color: active ? mc.color : 'rgba(255,255,255,0.7)' }}>
                  {mc.label}
                </span>
                {active && (
                  <span className="ml-auto text-xs" style={{ color: mc.color }}>●</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
