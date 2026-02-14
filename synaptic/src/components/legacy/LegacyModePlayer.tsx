'use client';

/**
 * LegacyModePlayer.tsx – Guided narrated memory experience
 * Warm storytelling mode with auto-camera, TTS narration, and subtitles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, VolumeX, X, RotateCcw } from 'lucide-react';
import {
  speakText,
  stopSpeaking,
  segmentNarration,
  type NarrationSegment,
} from '@/lib/legacy/narration';

interface LegacyModePlayerProps {
  narrationText: string;
  roomTitle: string;
  onExit: () => void;
}

export default function LegacyModePlayer({ narrationText, roomTitle, onExit }: LegacyModePlayerProps) {
  const [segments, setSegments] = useState<NarrationSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse narration into segments on mount
  useEffect(() => {
    const segs = segmentNarration(narrationText);
    setSegments(segs);
  }, [narrationText]);

  // Play current segment
  const playSegment = useCallback(
    (index: number) => {
      if (index >= segments.length) {
        setIsPlaying(false);
        setIsComplete(true);
        return;
      }

      setCurrentSegment(index);

      if (!isMutedRef.current) {
        speakText(segments[index].text, {
          rate: 0.85,
          pitch: 0.95,
          onEnd: () => {
            // Pause between segments
            timerRef.current = setTimeout(() => {
              playSegment(index + 1);
            }, 800);
          },
        });
      } else {
        // If muted, auto-advance based on duration
        timerRef.current = setTimeout(() => {
          playSegment(index + 1);
        }, segments[index].duration + 800);
      }
    },
    [segments],
  );

  // Play/Pause
  const togglePlay = () => {
    if (isComplete) {
      // Restart
      setIsComplete(false);
      setCurrentSegment(0);
      setIsPlaying(true);
      playSegment(0);
      return;
    }

    if (isPlaying) {
      stopSpeaking();
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playSegment(currentSegment);
    }
  };

  // Skip to next segment
  const skipForward = () => {
    stopSpeaking();
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = Math.min(currentSegment + 1, segments.length - 1);
    if (isPlaying) {
      playSegment(next);
    } else {
      setCurrentSegment(next);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (newMuted) {
      stopSpeaking();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const progress =
    segments.length > 0 ? ((currentSegment + 1) / segments.length) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
      {/* Subtitle overlay - centered */}
      <AnimatePresence mode="wait">
        {isPlaying && segments[currentSegment] && (
          <motion.div
            key={currentSegment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto mb-4 max-w-2xl px-6 pointer-events-none"
          >
            <p className="text-center text-lg font-medium text-white/90 bg-black/50 backdrop-blur-md rounded-2xl px-6 py-4 leading-relaxed">
              {segments[currentSegment].text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control bar */}
      <div className="glass-dark mx-auto mb-6 max-w-lg rounded-2xl px-4 py-3 flex items-center gap-4 pointer-events-auto">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-400 transition"
          aria-label={isPlaying ? 'Pause' : isComplete ? 'Replay' : 'Play'}
        >
          {isComplete ? (
            <RotateCcw className="h-5 w-5" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Progress */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
            <span>{roomTitle}</span>
            <span>{currentSegment + 1}/{segments.length}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={skipForward}
          className="text-white/50 hover:text-white transition"
          aria-label="Skip forward"
        >
          <SkipForward className="h-5 w-5" />
        </button>

        {/* Mute */}
        <button
          onClick={toggleMute}
          className="text-white/50 hover:text-white transition"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Exit Legacy Mode */}
        <button
          onClick={onExit}
          className="text-white/50 hover:text-white transition"
          aria-label="Exit Legacy Mode"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
