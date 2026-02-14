'use client';

/**
 * Create Room Page – Multi-step form for building a memory room
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import PhotoUpload from '@/components/ui/PhotoUpload';
import LoadingRoom from '@/components/ui/LoadingRoom';
import { compressImage, convertToBase64 } from '@/lib/utils/imageProcessing';
import { saveRoom } from '@/lib/db';
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
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
          caption: '',
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
        isPublic,
        isLegacy,
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
          {step === 1 && 'Add 2–5 photos from the memory you want to preserve'}
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
          <PhotoUpload value={photos} onChange={setPhotos} maxFiles={5} />
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
          <div className="space-y-4">
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
