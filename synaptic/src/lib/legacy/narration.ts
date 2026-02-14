/**
 * narration.ts – Narration segmentation and browser TTS
 * NOTE: Server-side narration generation is done via /api/narration route.
 * This module only contains client-safe utilities (no server imports).
 */

export interface NarrationSegment {
  id: string;
  text: string;
  startTime: number; // ms offset from start
  duration: number;  // estimated ms
}

const WORDS_PER_MINUTE = 140; // slow, warm narration pace

/**
 * Break a narration into timestamped segments for guided playback
 */
export function segmentNarration(fullText: string): NarrationSegment[] {
  const sentences = fullText
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const segments: NarrationSegment[] = [];
  let offset = 0;

  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i].trim();
    const wordCount = text.split(/\s+/).length;
    const duration = Math.round((wordCount / WORDS_PER_MINUTE) * 60 * 1000);

    segments.push({
      id: `seg-${i}`,
      text,
      startTime: offset,
      duration,
    });

    offset += duration + 500; // 500ms pause between sentences
  }

  return segments;
}

/**
 * Speak text using the browser's SpeechSynthesis API (free TTS)
 */
export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  },
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 0.85;
  utterance.pitch = options?.pitch ?? 0.95;
  utterance.volume = 1;

  // Try to pick a warm, natural-sounding voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes('Google') && v.lang.startsWith('en') ||
      v.name.includes('Samantha') ||
      v.name.includes('Daniel'),
  );
  if (preferred) utterance.voice = preferred;

  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onBoundary) {
    utterance.onboundary = (e) => options.onBoundary!(e.charIndex);
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop ongoing TTS
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
