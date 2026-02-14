'use client';

/**
 * Room Page – Immersive 3D memory room with multiplayer and chat
 * URL: /room/[id]
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getRoomById, incrementVisitCount, addPhotosToRoom, saveRoom, removePhotoFromRoom, updatePhotoCaption } from '@/lib/db';
import { convertToBase64 } from '@/lib/utils/imageProcessing';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import ChatPanel from '@/components/ui/ChatPanel';
import MoodIndicator from '@/components/ui/MoodIndicator';
import HUD from '@/components/ui/HUD';
import LegacyModePlayer from '@/components/legacy/LegacyModePlayer';
import type { MemoryRoom, Photo } from '@/types/room';
import type { SceneData, SceneObject } from '@/types/room';
import type { Mood } from '@/types/scene';
import { ROOM_THEMES } from '@/lib/constants';

// Dynamic import for heavy 3D component (no SSR)
const Scene = dynamic(() => import('@/components/3d/Scene'), { ssr: false });

/**
 * Inject the user's uploaded photos as framed 3D objects into the scene.
 * Places them in an immersive curved arc arrangement facing the viewer.
 */
function injectPhotoFrames(sceneData: SceneData, photos: MemoryRoom['photos']): SceneData {
  if (!photos || photos.length === 0) return sceneData;

  // Check if photo objects already exist
  const hasPhotoObjects = sceneData.objects.some((o) => o.type === 'photo');
  if (hasPhotoObjects) return sceneData;

  const photoObjects: SceneObject[] = photos.map((photo, idx) => {
    const total = photos.length;

    // Double ring layout: outer ring (first 10 or all if <=10), inner ring (remaining)
    const outerCount = Math.min(total, 10);
    const isInner = idx >= outerCount;
    const ringIndex = isInner ? idx - outerCount : idx;
    const ringTotal = isInner ? total - outerCount : outerCount;

    const radius = isInner ? 4.5 : 7;
    const photoHeight = isInner ? 2.0 : 2.2;
    const photoScale: [number, number, number] = isInner ? [2.2, 1.65, 1] : [2.8, 2.1, 1];

    // Full 360° circle — leave a ~50° gap at the front (z+ camera entrance)
    const gapAngle = 50 * (Math.PI / 180);
    const usableAngle = 2 * Math.PI - gapAngle;

    const startAngle = gapAngle / 2;
    const angleStep = ringTotal > 1 ? usableAngle / (ringTotal - 1) : 0;
    const angle = ringTotal > 1 ? startAngle + ringIndex * angleStep : Math.PI;

    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    // Face toward center (0,0,0) — add PI to flip from outward to inward
    const rotY = Math.atan2(x, z) + Math.PI;

    // Stagger vertical position slightly for visual interest
    const yOffset = ringTotal > 3 ? Math.sin(ringIndex * 1.2) * 0.2 : 0;

    return {
      id: `photo-frame-${idx}`,
      type: 'photo' as const,
      name: photo.caption || photo.filename || `Memory ${idx + 1}`,
      position: [x, photoHeight + yOffset, z] as [number, number, number],
      rotation: [0, rotY, 0] as [number, number, number],
      scale: photoScale,
      textureUrl: photo.url,
      color: '#1a1525',
      interactive: true,
      memoryText: photo.caption || `A captured moment — ${photo.filename || 'photo ' + (idx + 1)}`,
      castShadow: true,
      receiveShadow: true,
    };
  });

  return {
    ...sceneData,
    objects: [...sceneData.objects, ...photoObjects],
  };
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<MemoryRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoryPopup, setMemoryPopup] = useState<string | null>(null);
  const [photoViewer, setPhotoViewer] = useState<{ url: string; caption: string; index: number; total: number; photoId: string } | null>(null);
  const [legacyMode, setLegacyMode] = useState(false);
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [showAddPhotos, setShowAddPhotos] = useState(false);
  const [addingPhotos, setAddingPhotos] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [autoTour, setAutoTour] = useState(false);
  const [tourPhotoIndex, setTourPhotoIndex] = useState(0);
  const [theme, setTheme] = useState('midnight');
  const [showWelcome, setShowWelcome] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode; oscs: OscillatorNode[] } | null>(null);

  // Multiplayer connection
  const {
    players,
    chatMessages,
    isConnected,
    connectionId,
    currentMood,
    sendPosition,
    sendChat,
    updateMood,
  } = useMultiplayer({
    roomId,
    playerName: 'Explorer',
    avatarColor: '#6366f1',
    enabled: !!room,
  });

  // Sentiment-based mood (simplified: switches mood based on chat analysis)
  const [mood, setMood] = useState<Mood>('neutral');

  useEffect(() => {
    setMood(currentMood);
  }, [currentMood]);

  // Auto-analyze sentiment every 5 chat messages
  useEffect(() => {
    if (chatMessages.length > 0 && chatMessages.length % 5 === 0) {
      const recent = chatMessages.slice(-5).map((m) => m.text);
      fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recent }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.mood) {
            updateMood(data.mood);
          }
        })
        .catch(console.error);
    }
  }, [chatMessages.length]);

  // Load room data from IndexedDB
  useEffect(() => {
    async function loadRoom() {
      try {
        const data = await getRoomById(roomId);
        if (!data) {
          router.push('/gallery');
          return;
        }

        // Inject uploaded photos as framed 3D objects into the scene
        if (data.photos && data.photos.length > 0) {
          data.sceneData = injectPhotoFrames(data.sceneData, data.photos);
        }

        setRoom(data);
        setShowWelcome(true);
        await incrementVisitCount(roomId);

        // Auto-activate legacy mode and generate narration
        if (data.isLegacy) {
          setLegacyMode(true);
          try {
            const res = await fetch('/api/narration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: data.title,
                description: data.description,
                photoAnalysis: data.sceneData?.objects?.map((o: any) => o.name).join(', ') || '',
              }),
            });
            const narData = await res.json();
            if (narData.success) setNarrationText(narData.narration);
          } catch (e) {
            console.error('Narration generation failed:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load room:', err);
      } finally {
        setLoading(false);
      }
    }
    if (roomId) loadRoom();
  }, [roomId, router]);

  const handleObjectClick = useCallback((objectId: string, memoryText?: string, textureUrl?: string) => {
    if (textureUrl) {
      // Find which photo index this is for navigation
      const photoObjects = room?.sceneData.objects.filter(o => o.type === 'photo') || [];
      const idx = photoObjects.findIndex(o => o.id === objectId);
      const photoId = room?.photos?.[idx]?.id || '';
      setPhotoViewer({ url: textureUrl, caption: memoryText || '', index: idx, total: photoObjects.length, photoId });
      setEditingCaption(false);
    } else if (memoryText) {
      setMemoryPopup(memoryText);
    }
  }, [room]);

  /** Navigate to prev/next photo in viewer */
  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    if (!photoViewer || !room) return;
    const photos = room.sceneData.objects.filter(o => o.type === 'photo');
    if (photos.length <= 1) return;
    const newIdx = direction === 'next'
      ? (photoViewer.index + 1) % photos.length
      : (photoViewer.index - 1 + photos.length) % photos.length;
    const target = photos[newIdx];
    const photoId = room.photos?.[newIdx]?.id || '';
    if (target) {
      setPhotoViewer({ url: target.textureUrl || '', caption: target.memoryText || '', index: newIdx, total: photos.length, photoId });
      setEditingCaption(false);
    }
  }, [photoViewer, room]);

  /** Delete a photo from the room */
  const handleDeletePhoto = useCallback(async () => {
    if (!photoViewer || !room) return;
    const photoId = photoViewer.photoId;
    if (!photoId) return;
    if (!confirm('Delete this memory? This cannot be undone.')) return;

    try {
      await removePhotoFromRoom(roomId, photoId);
      // Reload room
      const updated = await getRoomById(roomId);
      if (updated) {
        updated.sceneData.objects = updated.sceneData.objects.filter(o => o.type !== 'photo');
        updated.sceneData = injectPhotoFrames(updated.sceneData, updated.photos);
        setRoom(updated);
        // If more photos remain, show previous one; otherwise close viewer
        if (updated.photos && updated.photos.length > 0) {
          const newIdx = Math.min(photoViewer.index, updated.photos.length - 1);
          const p = updated.photos[newIdx];
          setPhotoViewer({ url: p.url, caption: p.caption || '', index: newIdx, total: updated.photos.length, photoId: p.id });
        } else {
          setPhotoViewer(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  }, [photoViewer, room, roomId]);

  /** Save edited caption */
  const handleSaveCaption = useCallback(async () => {
    if (!photoViewer || !room || !photoViewer.photoId) return;
    try {
      await updatePhotoCaption(roomId, photoViewer.photoId, captionDraft);
      // Reload room
      const updated = await getRoomById(roomId);
      if (updated) {
        updated.sceneData.objects = updated.sceneData.objects.filter(o => o.type !== 'photo');
        updated.sceneData = injectPhotoFrames(updated.sceneData, updated.photos);
        setRoom(updated);
        setPhotoViewer(prev => prev ? { ...prev, caption: captionDraft } : null);
      }
      setEditingCaption(false);
    } catch (err) {
      console.error('Failed to update caption:', err);
    }
  }, [photoViewer, room, roomId, captionDraft]);

  /** Toggle browser fullscreen */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const handleBackClick = () => {
    router.push('/gallery');
  };

  /** Handle adding new photos to the room */
  const handleAddPhotos = useCallback(async (files: FileList) => {
    if (!room || files.length === 0) return;
    setAddingPhotos(true);
    try {
      const newPhotos: Photo[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const base64 = await convertToBase64(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: base64,
          caption: '',
          filename: file.name,
          uploadedAt: new Date(),
        });
      }
      if (newPhotos.length === 0) return;

      // Save to DB
      await addPhotosToRoom(roomId, newPhotos);

      // Reload room to get fresh data with new photos
      const updated = await getRoomById(roomId);
      if (updated) {
        // Re-inject photo frames with all photos
        // First remove existing photo objects
        updated.sceneData.objects = updated.sceneData.objects.filter(o => o.type !== 'photo');
        updated.sceneData = injectPhotoFrames(updated.sceneData, updated.photos);
        setRoom(updated);
      }
    } catch (err) {
      console.error('Failed to add photos:', err);
    } finally {
      setAddingPhotos(false);
      setShowAddPhotos(false);
    }
  }, [room, roomId]);

  /** Copy room link to clipboard */
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }).catch(() => {
      // Fallback
      prompt('Share this link:', url);
    });
  }, [roomId]);

  // Welcome toast — auto-dismiss after 4 seconds
  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => setShowWelcome(false), 4000);
    return () => clearTimeout(timer);
  }, [showWelcome]);

  // Auto-tour timer — advance to next photo every 5 seconds
  useEffect(() => {
    if (!autoTour || !room) return;
    const photos = room.sceneData.objects.filter(o => o.type === 'photo');
    if (photos.length === 0) { setAutoTour(false); return; }

    const interval = setInterval(() => {
      setTourPhotoIndex(prev => (prev + 1) % photos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoTour, room]);

  // Compute tour target position for the camera
  const tourTarget = useMemo(() => {
    if (!autoTour || !room) return null;
    const photos = room.sceneData.objects.filter(o => o.type === 'photo');
    if (photos.length === 0) return null;

    const photo = photos[tourPhotoIndex % photos.length];
    const [px, py, pz] = photo.position;
    const angle = Math.atan2(px, pz);

    // Camera sits at half the circle radius, same angle as the photo
    const camR = 3.5;
    return {
      position: [Math.sin(angle) * camR, 2.2, Math.cos(angle) * camR] as [number, number, number],
      lookAt: [px, py, pz] as [number, number, number],
    };
  }, [autoTour, tourPhotoIndex, room]);

  /** Toggle ambient background music (Web Audio API synth pad) */
  const toggleMusic = useCallback(() => {
    if (musicPlaying && audioRef.current) {
      // Fade out and stop
      audioRef.current.gain.gain.exponentialRampToValueAtTime(0.001, audioRef.current.ctx.currentTime + 1);
      const ref = audioRef.current;
      setTimeout(() => {
        ref.oscs.forEach(o => { try { o.stop(); } catch {} });
        ref.ctx.close().catch(() => {});
      }, 1100);
      audioRef.current = null;
      setMusicPlaying(false);
    } else {
      // Create ethereal ambient pad
      const ctx = new AudioContext();
      // Resume context if browser suspended it (autoplay policy)
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.0; // Start silent for fade-in
      masterGain.connect(ctx.destination);
      // Smooth fade-in over 2 seconds
      masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 2);

      // Ethereal A minor pad — warm, dreamy frequencies
      const notes = [110, 130.81, 164.81, 220, 261.63]; // A2, C3, E3, A3, C4
      const oscs: OscillatorNode[] = [];

      notes.forEach((freq, i) => {
        // Each note gets 2 slightly detuned oscillators for rich chorus effect
        for (let d = 0; d < 2; d++) {
          const osc = ctx.createOscillator();
          osc.type = i < 3 ? 'sine' : 'triangle';
          osc.frequency.value = freq;
          osc.detune.value = d === 0 ? -6 : 6; // ±6 cents for chorus

          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.12 - i * 0.015;
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start();
          oscs.push(osc);
        }
      });

      // Slow LFO to gently pulse the volume (breathing effect)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15; // Very slow
      lfo.connect(lfoGain);
      lfoGain.gain.value = 0.04;
      lfoGain.connect(masterGain.gain);
      lfo.start();
      oscs.push(lfo); // Track for cleanup

      audioRef.current = { ctx, gain: masterGain, oscs };
      setMusicPlaying(true);
    }
  }, [musicPlaying]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.oscs.forEach(o => { try { o.stop(); } catch {} });
        audioRef.current.ctx.close();
      }
    };
  }, []);

  // Keyboard navigation: arrow keys, ESC, F for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Photo viewer controls
      if (photoViewer) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePhoto('prev'); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); navigatePhoto('next'); }
        else if (e.key === 'Escape') { setPhotoViewer(null); setEditingCaption(false); }
        return;
      }
      // Global shortcuts
      if (e.key === 'Escape') { setMemoryPopup(null); setShowThemePicker(false); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photoViewer, navigatePhoto, toggleFullscreen]);

  // Listen for fullscreen changes (e.g. user presses F11 or ESC)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a1a]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading memory room…</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="fixed inset-0">
      {/* 3D Scene */}
      <Scene
        sceneData={room.sceneData}
        players={players}
        localPlayerId={connectionId || undefined}
        mood={mood}
        onPlayerMove={sendPosition}
        onObjectClick={handleObjectClick}
        roomTitle={room.title}
        tourTarget={tourTarget}
        theme={theme}
      />

      {/* HUD Overlay */}
      <HUD
        roomTitle={room.title}
        playerCount={players.size + 1}
        isConnected={isConnected}
        onBackClick={handleBackClick}
      />

      {/* Room Action Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
        {/* Auto Tour */}
        <button
          onClick={() => { setAutoTour(!autoTour); if (!autoTour) setTourPhotoIndex(0); }}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 backdrop-blur-md border ${
            autoTour
              ? 'bg-purple-500/25 border-purple-400/40 text-purple-300'
              : 'bg-white/[0.08] border-white/10 text-white/80 hover:bg-white/15 hover:border-purple-400/40 hover:text-white'
          }`}
        >
          <span className="text-base">{autoTour ? '⏸' : '▶'}</span>
          {autoTour ? 'Pause' : 'Tour'}
        </button>

        {/* Theme Picker */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 bg-white/[0.08] backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/15 hover:border-purple-400/40 hover:text-white"
          >
            <span className="w-3 h-3 rounded-full" style={{ background: (ROOM_THEMES[theme] || ROOM_THEMES.midnight).accent }} />
            Theme
          </button>
          {showThemePicker && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-1 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 shadow-xl">
              {Object.entries(ROOM_THEMES).map(([key, themeDef]) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setShowThemePicker(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all ${
                    theme === key ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: themeDef.accent }} />
                  {themeDef.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Music Toggle */}
        <button
          onClick={toggleMusic}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 backdrop-blur-md border ${
            musicPlaying
              ? 'bg-purple-500/25 border-purple-400/40 text-purple-300'
              : 'bg-white/[0.08] border-white/10 text-white/80 hover:bg-white/15 hover:border-purple-400/40 hover:text-white'
          }`}
        >
          <span className="text-base">{musicPlaying ? '♫' : '♪'}</span>
          {musicPlaying ? 'On' : 'Off'}
        </button>

        {/* Add Photos */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={addingPhotos}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 bg-white/[0.08] backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/15 hover:border-purple-400/40 hover:text-white disabled:opacity-50"
        >
          {addingPhotos ? (
            <span className="animate-spin text-base">⟳</span>
          ) : (
            <span className="text-base">＋</span>
          )}
          {addingPhotos ? 'Adding…' : 'Add'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleAddPhotos(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {/* Share Room */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 bg-white/[0.08] backdrop-blur-md border border-white/10 text-white/80 hover:bg-white/15 hover:border-purple-400/40 hover:text-white"
        >
          <span className="text-base">↗</span>
          Share
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 backdrop-blur-md border ${
            isFullscreen
              ? 'bg-purple-500/25 border-purple-400/40 text-purple-300'
              : 'bg-white/[0.08] border-white/10 text-white/80 hover:bg-white/15 hover:border-purple-400/40 hover:text-white'
          }`}
          title="Toggle fullscreen (F)"
        >
          <span className="text-base">{isFullscreen ? '⊡' : '⊞'}</span>
        </button>

        {/* Photo count badge */}
        {room.photos && room.photos.length > 0 && (
          <div className="rounded-xl px-3 py-2.5 text-xs font-medium bg-purple-500/20 backdrop-blur-md border border-purple-400/20 text-purple-300">
            {room.photos.length} {room.photos.length === 1 ? 'memory' : 'memories'}
          </div>
        )}
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="rounded-xl px-5 py-3 bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 text-sm font-medium">
            ✓ Room link copied to clipboard!
          </div>
        </div>
      )}

      {/* Welcome Toast — shows on room entry */}
      {showWelcome && room && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
          <div className="text-center animate-fade-in">
            <p className="text-white/30 text-sm tracking-[0.3em] uppercase mb-3">Welcome to</p>
            <h1 className="text-4xl md:text-5xl font-light text-white/90 tracking-wide">{room.title}</h1>
            <div className="mt-4 w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
            <p className="text-white/40 text-sm mt-4">
              {room.photos?.length || 0} {(room.photos?.length || 0) === 1 ? 'memory' : 'memories'} await
            </p>
          </div>
        </div>
      )}

      {/* Mood Indicator */}
      <MoodIndicator mood={mood} />

      {/* Chat Panel */}
      <ChatPanel
        messages={chatMessages}
        onSendMessage={sendChat}
        localPlayerId={connectionId || undefined}
        isConnected={isConnected}
      />

      {/* Legacy Mode Player */}
      {legacyMode && narrationText && (
        <LegacyModePlayer
          narrationText={narrationText}
          roomTitle={room.title}
          onExit={() => setLegacyMode(false)}
        />
      )}

      {/* Memory Popup (when clicking interactive objects) */}
      {memoryPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="glass-card max-w-md text-center">
            <p className="text-white/80 text-sm italic leading-relaxed">&ldquo;{memoryPopup}&rdquo;</p>
            <button
              onClick={() => setMemoryPopup(null)}
              className="btn-secondary mt-4 text-sm px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Immersive Photo Viewer */}
      {photoViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,10,30,0.95) 0%, rgba(0,0,0,0.98) 100%)' }}
          onClick={() => { setPhotoViewer(null); setEditingCaption(false); }}
        >
          {/* Decorative corner accents */}
          <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-purple-400/40" />
          <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-purple-400/40" />
          <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-purple-400/40" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-purple-400/40" />

          {/* Prev button */}
          {photoViewer.total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigatePhoto('prev'); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all text-xl"
            >
              ‹
            </button>
          )}

          {/* Next button */}
          {photoViewer.total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigatePhoto('next'); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all text-xl"
            >
              ›
            </button>
          )}

          {/* Photo container */}
          <div
            className="relative max-w-[85vw] max-h-[85vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo counter */}
            {photoViewer.total > 1 && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white/40 text-sm tracking-widest">
                {photoViewer.index + 1} / {photoViewer.total}
              </div>
            )}

            {/* Photo with frame glow */}
            <div className="relative group">
              <div
                className="absolute -inset-3 rounded-lg opacity-60 blur-xl"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                }}
              />
              <div className="relative border-4 border-white/20 rounded-lg shadow-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoViewer.url}
                  alt={photoViewer.caption || 'Memory photo'}
                  className="max-w-[80vw] max-h-[60vh] object-contain"
                  style={{ imageRendering: 'auto' }}
                />
              </div>
            </div>

            {/* Caption — editable */}
            <div className="text-center max-w-lg w-full">
              {editingCaption ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCaption();
                      if (e.key === 'Escape') setEditingCaption(false);
                    }}
                    autoFocus
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/90 text-sm focus:outline-none focus:border-purple-400/60 placeholder-white/30"
                    placeholder="Add a caption for this memory..."
                  />
                  <button
                    onClick={handleSaveCaption}
                    className="px-3 py-2 rounded-lg bg-purple-500/30 border border-purple-400/40 text-purple-300 text-sm hover:bg-purple-500/50 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCaption(false)}
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/60 text-sm hover:bg-white/20 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="group/caption">
                  <p
                    className="text-white/70 text-lg italic leading-relaxed font-light tracking-wide cursor-pointer hover:text-white/90 transition-all"
                    onClick={() => { setEditingCaption(true); setCaptionDraft(photoViewer.caption || ''); }}
                    title="Click to edit caption"
                  >
                    {photoViewer.caption ? `\u201C${photoViewer.caption}\u201D` : (
                      <span className="text-white/30 not-italic text-sm">Click to add a caption...</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-3 mt-1">
              {/* Edit caption button */}
              <button
                onClick={() => { setEditingCaption(true); setCaptionDraft(photoViewer.caption || ''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] border border-white/15 text-white/60 text-xs hover:text-white hover:bg-white/15 transition-all"
                title="Edit caption"
              >
                ✎ Caption
              </button>
              {/* Delete button */}
              <button
                onClick={handleDeletePhoto}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-400/20 text-red-400/70 text-xs hover:text-red-300 hover:bg-red-500/25 hover:border-red-400/40 transition-all"
                title="Delete this photo"
              >
                🗑 Delete
              </button>
            </div>

            {/* Controls hint */}
            <p className="text-white/30 text-xs tracking-widest uppercase">ESC to close · Arrow keys to navigate</p>
          </div>

          {/* Close button */}
          <button
            onClick={() => { setPhotoViewer(null); setEditingCaption(false); }}
            className="absolute top-8 right-8 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-all duration-300 hover:rotate-90"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
