'use client';

/**
 * MoodIndicator.tsx – Displays current room mood / sentiment
 */

import { Sun, Cloud, CloudRain, CloudDrizzle, Sparkles } from 'lucide-react';
import type { Mood } from '@/types/scene';
import { MOOD_CONFIGS } from '@/lib/constants';

interface MoodIndicatorProps {
  mood: Mood;
  sentiment?: number;
}

const moodIcons: Record<Mood, React.ElementType> = {
  joyful: Sun,
  content: Sparkles,
  neutral: Cloud,
  melancholic: CloudDrizzle,
  sad: CloudRain,
};

export default function MoodIndicator({ mood, sentiment }: MoodIndicatorProps) {
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.neutral;
  const Icon = moodIcons[mood] || Cloud;

  return (
    <div className="fixed top-20 left-4 z-40">
      <div className="glass-dark rounded-xl px-4 py-3 flex items-center gap-3 min-w-[140px]">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div>
          <p className="text-xs text-white/50">Room Mood</p>
          <p className="text-sm font-medium" style={{ color: config.color }}>
            {config.label}
          </p>
        </div>
      </div>
    </div>
  );
}
