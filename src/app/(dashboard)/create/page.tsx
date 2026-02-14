'use client';

/**
 * Create Room Page – Multi-step form for building a memory room
 */

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, Mic, Square, Pencil, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import PhotoUpload from '@/components/ui/PhotoUpload';
import LoadingRoom from '@/components/ui/LoadingRoom';
import { compressImage, convertToBase64 } from '@/lib/utils/imageProcessing';
import { saveRoom } from '@/lib/db';
import { ROOM_THEMES } from '@/lib/constants';
import { nanoid } from 'nanoid';
import { useAuth } from '@/hooks/useAuth';
import type { MemoryRoom, Photo } from '@/types/room';

const GENERATION_STEPS = [
  'Analyzing your photos…',
  'Planning 3D scene layout…',
  'Generating panoramic environment…',
  'Building your memory room…',
];

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Form state
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<Record<number, string>>({});
  const [captioningIdx, setCaptioningIdx] = useState<Set<number>>(new Set());
  const [editingCaptionIdx, setEditingCaptionIdx] = useState<number | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);
  const [roomTheme, setRoomTheme] = useState('valentine');
  const [lockDate, setLockDate] = useState('');
  const [location, setLocation] = useState('');
  const [voiceNotes, setVoiceNotes] = useState<Record<number, string>>({});
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** Auto-caption a single photo using AI vision */
  const captionPhoto = useCallback(async (file: File, index: number) => {
    try {
      setCaptioningIdx(prev => new Set(prev).add(index));
      const base64 = await convertToBase64(file);
      const res = await fetch('/api/caption-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: base64 }),
      });
      const data = await res.json();
      if (data.success && data.caption) {
        setPhotoCaptions(prev => ({ ...prev, [index]: data.caption }));
      }
    } catch (err) {
      console.error('Auto-caption failed for photo', index, err);
    } finally {
      setCaptioningIdx(prev => { const s = new Set(prev); s.delete(index); return s; });
    }
  }, []);

  /** Handle photo changes — auto-caption new additions */
  const handlePhotosChange = useCallback((files: File[]) => {
    const prevCount = photos.length;
    setPhotos(files);
    // Caption any newly added photos
    files.forEach((file, i) => {
      if (i >= prevCount && !photoCaptions[i]) {
        captionPhoto(file, i);
      }
    });
  }, [photos.length, photoCaptions, captionPhoto]);

  /** Start recording a voice note for a photo */
  const startRecording = useCallback(async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVoiceNotes(prev => ({ ...prev, [index]: reader.result as string }));
        };
        reader.readAsDataURL(blob);
        setRecordingIdx(null);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingIdx(index);
      // Auto-stop after 30 seconds
      setTimeout(() => { if (mediaRecorder.state === 'recording') mediaRecorder.stop(); }, 30000);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  }, []);

  /** Stop recording the current voice note */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const canNext = () => {
    if (step === 1) return photos.length >= 2;
    if (step === 2) return description.trim().length >= 10;
    if (step === 3) return title.trim().length >= 2;
    return false;
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setGenStep(0);
      setError(null);

      // Step 1: Compress photos and convert to base64
      const compressedPhotos: Photo[] = [];
      const formData = new FormData();

      for (let i = 0; i < photos.length; i++) {
        const compressed = await compressImage(photos[i], 2);
        formData.append('photos', compressed);
        const base64 = await convertToBase64(compressed);
        compressedPhotos.push({
          id: nanoid(8),
          url: base64,
          caption: photoCaptions[i] || '',
          voiceNote: voiceNotes[i] || undefined,
          filename: photos[i].name,
          uploadedAt: new Date(),
        });
      }

      // Step 2: Analyze photos (text-based, uses description)
      setGenStep(0);
      formData.append('description', description);
      const analyzeRes = await fetch('/api/analyze-photos', { method: 'POST', body: formData });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.success) throw new Error(analyzeData.error || 'Photo analysis failed');

      // Step 3: Generate scene
      setGenStep(1);
      const sceneRes = await fetch('/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: analyzeData.analysis, description }),
      });
      const sceneData = await sceneRes.json();
      if (!sceneData.success) throw new Error(sceneData.error || 'Scene generation failed');

      setGenStep(2);
      // Small delay for panorama generation illusion
      await new Promise((r) => setTimeout(r, 1500));

      // Step 4: Save room
      setGenStep(3);
      const roomId = nanoid(12);
      const room: MemoryRoom = {
        id: roomId,
        userId: user?.id || 'anonymous',
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        photos: compressedPhotos,
        sceneData: sceneData.sceneData,
        theme: roomTheme,
        location: location.trim() || undefined,
        isPublic,
        isLegacy,
        lockedUntil: lockDate ? new Date(lockDate) : undefined,
        visitCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveRoom(room);
      await new Promise((r) => setTimeout(r, 500));

      // Redirect to room
      router.push(`/room/${roomId}`);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setGenerating(false);
    }
  };

  // Show loading screen during generation
  if (generating) {
    return <LoadingRoom currentStep={genStep} steps={GENERATION_STEPS} />;
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <div className="mx-auto max-w-2xl px-6 pt-28">
        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {step === 1 && 'Upload Your Photos'}
          {step === 2 && 'Describe the Memory'}
          {step === 3 && 'Final Details'}
        </h1>
        <p className="text-white/50 text-sm mb-8">
          {step === 1 && 'Add 2–10 photos from the memory you want to preserve'}
          {step === 2 && 'Tell us what made this moment special'}
          {step === 3 && 'Give your room a title and optional tags'}
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Photos */}
        {step === 1 && (
          <div className="space-y-4">
            <PhotoUpload value={photos} onChange={handlePhotosChange} maxFiles={10} />
            {/* AI Captions */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 flex items-center gap-2">
                  <span className="text-base">✨</span> AI is generating captions for your photos
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {photos.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
                      <span className="text-xs text-white/30 w-5 flex-shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        {captioningIdx.has(i) ? (
                          <span className="text-xs text-purple-400 animate-pulse">Generating caption...</span>
                        ) : editingCaptionIdx === i ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingCaptionText}
                              onChange={(e) => setEditingCaptionText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setPhotoCaptions(prev => ({ ...prev, [i]: editingCaptionText.trim() }));
                                  setEditingCaptionIdx(null);
                                }
                                if (e.key === 'Escape') setEditingCaptionIdx(null);
                              }}
                              autoFocus
                              className="flex-1 bg-white/[0.06] border border-purple-400/30 rounded px-2 py-1 text-sm text-white/90 outline-none focus:border-purple-400/60 placeholder-white/30"
                              placeholder="Enter caption..."
                            />
                            <button
                              onClick={() => {
                                setPhotoCaptions(prev => ({ ...prev, [i]: editingCaptionText.trim() }));
                                setEditingCaptionIdx(null);
                              }}
                              className="text-green-400 hover:text-green-300 p-0.5"
                              title="Save caption"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : photoCaptions[i] ? (
                          <span
                            onClick={() => { setEditingCaptionIdx(i); setEditingCaptionText(photoCaptions[i]); }}
                            className="text-sm text-white/70 italic truncate block cursor-pointer hover:text-white/90 transition-colors"
                            title="Click to edit caption"
                          >&ldquo;{photoCaptions[i]}&rdquo;</span>
                        ) : (
                          <input
                            type="text"
                            value=""
                            onChange={(e) => setPhotoCaptions(prev => ({ ...prev, [i]: e.target.value }))}
                            onFocus={() => { setEditingCaptionIdx(i); setEditingCaptionText(''); }}
                            className="w-full bg-transparent border-none outline-none text-xs text-white/30 placeholder-white/30"
                            placeholder={file.name + ' — click to add caption'}
                          />
                        )}
                        {voiceNotes[i] && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-green-400">🎤 Voice note recorded</span>
                            <audio src={voiceNotes[i]} controls className="h-6 w-32" style={{ filter: 'invert(0.8)' }} />
                          </div>
                        )}
                      </div>
                      {/* Edit caption button */}
                      {!captioningIdx.has(i) && photoCaptions[i] && editingCaptionIdx !== i && (
                        <button
                          onClick={() => { setEditingCaptionIdx(i); setEditingCaptionText(photoCaptions[i]); }}
                          className="flex items-center p-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                          title="Edit caption"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      {/* Voice note record button */}
                      {recordingIdx === i ? (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-400/30 text-red-400 text-xs animate-pulse"
                          title="Stop recording"
                        >
                          <Square className="h-3 w-3" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => startRecording(i)}
                          disabled={recordingIdx !== null}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-white/50 text-xs hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                          title="Record voice note (max 30s)"
                        >
                          <Mic className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this memory… What happened? Who was there? What made it special?"
              rows={6}
              maxLength={500}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50 resize-none"
            />
            <p className="text-xs text-white/30 text-right">{description.length}/500</p>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Room Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer in Paris, Grandma's Kitchen"
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., travel, family, celebration"
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">📍 Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Paris, France · Grandma's House · Central Park"
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50"
              />
            </div>

            {/* Room Theme Picker */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Room Theme</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(ROOM_THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRoomTheme(key)}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 border transition-all duration-200 ${
                      roomTheme === key
                        ? 'bg-white/10 border-purple-400/60 ring-1 ring-purple-400/30 scale-[1.02]'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <span className={`text-xs font-medium ${roomTheme === key ? 'text-white' : 'text-white/50'}`}>{t.name}</span>
                    <div className="flex gap-1 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accentLight }} />
                    </div>
                    {roomTheme === key && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Memory Capsule – Time Lock */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">🔒 Memory Capsule (optional)</label>
              <p className="text-xs text-white/30 mb-2">Lock this room until a future date — it becomes a time capsule!</p>
              <input
                type="datetime-local"
                value={lockDate}
                onChange={(e) => setLockDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500/50 [color-scheme:dark]"
              />
              {lockDate && (
                <button
                  onClick={() => setLockDate('')}
                  className="mt-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                >
                  ✕ Remove time lock
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-primary-500"
                />
                <span className="text-sm text-white/60">Make this room public</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLegacy}
                  onChange={(e) => setIsLegacy(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-primary-500"
                />
                <span className="text-sm text-white/60">Enable Legacy Mode (narrated story)</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white disabled:opacity-20"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              Generate Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
