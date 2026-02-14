/**
 * Synaptic - Application Constants
 * Central configuration for moods, environments, camera, movement, and more.
 */

import type { MoodConfig, CameraConfig, MovementConfig } from '@/types/scene';

// ============================================
//  MOOD CONFIGURATIONS
// ============================================

export const MOOD_CONFIGS: Record<string, MoodConfig> = {
  joyful: {
    mood: 'joyful',
    label: 'Joyful',
    color: '#fbbf24',
    lighting: {
      ambientColor: '#fff7ed',
      ambientIntensity: 0.8,
      directionalColor: '#fde68a',
      directionalIntensity: 1.2,
      fogColor: '#fef3c7',
      fogDensity: 0.002,
    },
    weather: 'clear',
    particles: { type: 'sparkles', intensity: 0.7, color: '#fbbf24' },
    audio: {
      backgroundMusic: '/audio/music/joyful.mp3',
      ambientSounds: ['/audio/ambient/birds.mp3', '/audio/ambient/breeze.mp3'],
      volume: 0.5,
    },
    postProcessing: { bloom: 0.8, vignette: 0.1, saturation: 1.3, brightness: 1.1 },
  },
  content: {
    mood: 'content',
    label: 'Content',
    color: '#34d399',
    lighting: {
      ambientColor: '#f0fdf4',
      ambientIntensity: 0.6,
      directionalColor: '#bbf7d0',
      directionalIntensity: 0.9,
      fogColor: '#d1fae5',
      fogDensity: 0.003,
    },
    weather: 'clear',
    particles: { type: 'dust', intensity: 0.3, color: '#d1fae5' },
    audio: {
      backgroundMusic: '/audio/music/content.mp3',
      ambientSounds: ['/audio/ambient/gentle-wind.mp3'],
      volume: 0.4,
    },
    postProcessing: { bloom: 0.4, vignette: 0.15, saturation: 1.1, brightness: 1.0 },
  },
  neutral: {
    mood: 'neutral',
    label: 'Neutral',
    color: '#94a3b8',
    lighting: {
      ambientColor: '#94a3b8',
      ambientIntensity: 0.35,
      directionalColor: '#cbd5e1',
      directionalIntensity: 0.5,
      fogColor: '#0f0f1a',
      fogDensity: 0.002,
    },
    weather: 'cloudy',
    particles: { type: 'dust', intensity: 0.2, color: '#cbd5e1' },
    audio: {
      backgroundMusic: '/audio/music/neutral.mp3',
      ambientSounds: ['/audio/ambient/cafe.mp3'],
      volume: 0.35,
    },
    postProcessing: { bloom: 0.2, vignette: 0.2, saturation: 1.0, brightness: 1.0 },
  },
  melancholic: {
    mood: 'melancholic',
    label: 'Melancholic',
    color: '#818cf8',
    lighting: {
      ambientColor: '#e0e7ff',
      ambientIntensity: 0.35,
      directionalColor: '#a5b4fc',
      directionalIntensity: 0.5,
      fogColor: '#c7d2fe',
      fogDensity: 0.006,
    },
    weather: 'cloudy',
    particles: { type: 'fog', intensity: 0.5, color: '#c7d2fe' },
    audio: {
      backgroundMusic: '/audio/music/melancholic.mp3',
      ambientSounds: ['/audio/ambient/light-rain.mp3'],
      volume: 0.3,
    },
    postProcessing: { bloom: 0.3, vignette: 0.35, saturation: 0.8, brightness: 0.85 },
  },
  sad: {
    mood: 'sad',
    label: 'Sad',
    color: '#60a5fa',
    lighting: {
      ambientColor: '#dbeafe',
      ambientIntensity: 0.25,
      directionalColor: '#93c5fd',
      directionalIntensity: 0.35,
      fogColor: '#bfdbfe',
      fogDensity: 0.008,
    },
    weather: 'rain',
    particles: { type: 'rain', intensity: 0.8, color: '#93c5fd' },
    audio: {
      backgroundMusic: '/audio/music/sad.mp3',
      ambientSounds: ['/audio/ambient/heavy-rain.mp3', '/audio/ambient/thunder.mp3'],
      volume: 0.3,
    },
    postProcessing: { bloom: 0.15, vignette: 0.5, saturation: 0.6, brightness: 0.75 },
  },
};

// ============================================
//  CAMERA SETTINGS
// ============================================

export const CAMERA_SETTINGS: CameraConfig = {
  fov: 75,
  near: 0.1,
  far: 1000,
  initialPosition: [0, 1.6, 5],
  lookAt: [0, 1.6, 0],
};

// ============================================
//  MOVEMENT SETTINGS
// ============================================

export const MOVEMENT_SETTINGS: MovementConfig = {
  walkSpeed: 4,
  runMultiplier: 2,
  mouseSensitivity: 0.002,
  jumpEnabled: true,
  jumpForce: 5,
  playerHeight: 1.6,
};

// ============================================
//  API LIMITS
// ============================================

export const API_LIMITS = {
  /** Max requests per minute on Gemini free tier */
  geminiRateLimit: 15,
  /** Max photos per room */
  maxPhotosPerRoom: 20,
  /** Max image size in MB */
  maxImageSizeMB: 10,
  /** Max description length */
  maxDescriptionLength: 500,
  /** Max legacy description length */
  maxLegacyDescriptionLength: 1000,
  /** Max chat message length */
  maxChatMessageLength: 500,
  /** Chat rate limit (messages per minute) */
  chatRateLimit: 10,
};

// ============================================
//  MULTIPLAYER SETTINGS
// ============================================

export const MULTIPLAYER_SETTINGS = {
  /** Maximum players per room */
  maxPlayers: 8,
  /** Position update rate (per second) */
  positionUpdateRate: 10,
  /** Interpolation speed for remote avatars */
  interpolationSpeed: 8,
  /** Heartbeat/ping interval (ms) */
  heartbeatInterval: 30_000,
  /** Reconnect delay (ms) */
  reconnectDelay: 2_000,
  /** Max reconnect attempts */
  maxReconnectAttempts: 5,
  /** Max chat history in memory */
  maxChatHistory: 50,
};

// ============================================
//  SENTIMENT ANALYSIS SETTINGS
// ============================================

export const SENTIMENT_SETTINGS = {
  /** Messages to accumulate before analysis */
  messageThreshold: 5,
  /** Seconds between sentiment analyses */
  analysisInterval: 10,
  /** Mood transition duration (ms) */
  moodTransitionDuration: 2500,
};

// ============================================
//  ENVIRONMENT TEMPLATES (pre-built layouts)
// ============================================

export const ENVIRONMENT_TEMPLATES: Record<string, { name: string; description: string; panoramaKeywords: string[] }> = {
  cafe: {
    name: 'Cozy Café',
    description: 'A warm café with small tables, ambient lighting, and character',
    panoramaKeywords: ['cozy cafe interior', 'warm lighting', 'wooden tables', 'coffee shop', 'rainy window'],
  },
  kitchen: {
    name: 'Home Kitchen',
    description: 'A welcoming kitchen with countertops, stove, and family charm',
    panoramaKeywords: ['home kitchen interior', 'warm', 'wooden cabinets', 'family kitchen', 'nostalgic'],
  },
  bedroom: {
    name: 'Bedroom',
    description: 'A peaceful bedroom with soft lighting and personal touches',
    panoramaKeywords: ['cozy bedroom', 'soft lighting', 'personal space', 'warm', 'inviting'],
  },
  park: {
    name: 'Park / Garden',
    description: 'An outdoor park with trees, benches, and natural beauty',
    panoramaKeywords: ['beautiful park', 'green trees', 'sunny day', 'garden bench', 'nature'],
  },
  'living-room': {
    name: 'Living Room',
    description: 'A comfortable living room with couch, TV, and family photos',
    panoramaKeywords: ['living room', 'comfortable', 'family photos', 'warm lighting', 'cozy'],
  },
  workshop: {
    name: 'Workshop',
    description: 'A creative workshop or garage with tools and projects',
    panoramaKeywords: ['workshop', 'workbench', 'tools', 'creative space', 'garage'],
  },
};

// ============================================
//  AUDIO PATHS
// ============================================

export const AUDIO_PATHS = {
  music: {
    joyful: '/audio/music/joyful.mp3',
    content: '/audio/music/content.mp3',
    neutral: '/audio/music/neutral.mp3',
    melancholic: '/audio/music/melancholic.mp3',
    sad: '/audio/music/sad.mp3',
  },
  ambient: {
    birds: '/audio/ambient/birds.mp3',
    breeze: '/audio/ambient/breeze.mp3',
    gentleWind: '/audio/ambient/gentle-wind.mp3',
    cafe: '/audio/ambient/cafe.mp3',
    lightRain: '/audio/ambient/light-rain.mp3',
    heavyRain: '/audio/ambient/heavy-rain.mp3',
    thunder: '/audio/ambient/thunder.mp3',
  },
  effects: {
    click: '/audio/effects/click.mp3',
    join: '/audio/effects/join.mp3',
    leave: '/audio/effects/leave.mp3',
    message: '/audio/effects/message.mp3',
  },
};

// ============================================
//  ROOM THEMES
// ============================================

export const ROOM_THEMES: Record<string, { name: string; emoji: string; floor: string; wall: string; accent: string; accentLight: string; glow: string }> = {
  valentine: { name: 'Valentine', emoji: '💝', floor: '#1a0510', wall: '#1f0815', accent: '#f43f5e', accentLight: '#fda4af', glow: '#e11d48' },
  love:      { name: 'Love',      emoji: '❤️', floor: '#1a0808', wall: '#1f0a0a', accent: '#ef4444', accentLight: '#fca5a5', glow: '#dc2626' },
  friends:   { name: 'Friends',   emoji: '🤝', floor: '#0a0a15', wall: '#0e0e1a', accent: '#6366f1', accentLight: '#c4b5fd', glow: '#8b5cf6' },
  family:    { name: 'Family',    emoji: '🏠', floor: '#1a1208', wall: '#1a1510', accent: '#f59e0b', accentLight: '#fde68a', glow: '#d97706' },
  siblings:  { name: 'Siblings',  emoji: '👫', floor: '#051015', wall: '#0a1520', accent: '#06b6d4', accentLight: '#67e8f9', glow: '#0891b2' },
  adventure: { name: 'Adventure', emoji: '🌄', floor: '#080f08', wall: '#0a150e', accent: '#22c55e', accentLight: '#86efac', glow: '#16a34a' },
  nostalgia: { name: 'Nostalgia', emoji: '📷', floor: '#12100a', wall: '#181510', accent: '#d4a574', accentLight: '#e8c9a0', glow: '#b8956a' },
  midnight:  { name: 'Midnight',  emoji: '🌙', floor: '#050510', wall: '#08081a', accent: '#818cf8', accentLight: '#c7d2fe', glow: '#6366f1' },
};

// ============================================
//  AVATAR COLORS
// ============================================

export const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
] as const;
