/**
 * useStore.ts – Zustand global state store
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Mood } from '@/types/scene';
import type { MemoryRoom } from '@/types/room';

interface AppState {
  // Current room
  currentRoom: MemoryRoom | null;
  setCurrentRoom: (room: MemoryRoom | null) => void;

  // Mood
  mood: Mood;
  setMood: (mood: Mood) => void;

  // UI state
  isChatOpen: boolean;
  toggleChat: () => void;
  isLegacyMode: boolean;
  setLegacyMode: (enabled: boolean) => void;
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;

  // Audio
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (v: number) => void;

  // Loading
  isGenerating: boolean;
  generatingStep: number;
  setGenerating: (state: boolean, step?: number) => void;
}

export const useStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    // Current room
    currentRoom: null,
    setCurrentRoom: (room) => set({ currentRoom: room }),

    // Mood
    mood: 'neutral' as Mood,
    setMood: (mood) => set({ mood }),

    // UI
    isChatOpen: false,
    toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
    isLegacyMode: false,
    setLegacyMode: (enabled) => set({ isLegacyMode: enabled }),
    isMenuOpen: false,
    setMenuOpen: (open) => set({ isMenuOpen: open }),

    // Audio
    isMuted: false,
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    volume: 0.7,
    setVolume: (v) => set({ volume: v }),

    // Loading
    isGenerating: false,
    generatingStep: 0,
    setGenerating: (state, step = 0) => set({ isGenerating: state, generatingStep: step }),
  })),
);
