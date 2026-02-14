/**
 * API Request/Response Types
 * Type definitions for all API endpoints
 */

import type { Mood } from './scene';
import type { MemoryRoom, SceneData, EnvironmentType } from './room';

// ============================================
//  /api/analyze-photos
// ============================================

/** Result from Gemini photo analysis */
export interface PhotoAnalysis {
  /** Dominant hex colors extracted from the photos */
  dominantColors: string[];
  /** Objects/items detected in the photos */
  detectedObjects: string[];
  /** Suggested environment type for the 3D scene */
  environmentType: EnvironmentType;
  /** Detected emotional mood */
  mood: Mood;
  /** Time of day detected (morning, afternoon, evening, night) */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Notable details worth highlighting */
  notableDetails: string[];
  /** Overall scene description */
  sceneDescription: string;
}

export interface AnalyzePhotosResponse {
  success: boolean;
  analysis?: PhotoAnalysis;
  error?: string;
}

// ============================================
//  /api/generate-scene
// ============================================

/** Request body for scene generation */
export interface GenerateSceneRequest {
  analysis: PhotoAnalysis;
  description: string;
}

/** AI-generated scene layout plan */
export interface ScenePlan {
  /** Objects to place in the scene with positions */
  objects: Array<{
    name: string;
    type: 'model' | 'photo' | 'primitive';
    shape?: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color?: string;
    memoryText?: string;
    interactive?: boolean;
  }>;
  /** Suggested lighting config */
  lighting: {
    ambientColor: string;
    ambientIntensity: number;
    directionalColor: string;
    directionalIntensity: number;
    directionalPosition: [number, number, number];
  };
  /** Suggested audio ambiance */
  audio: {
    backgroundMusic: string;
    ambientSounds: string[];
  };
}

export interface GenerateSceneResponse {
  success: boolean;
  sceneData?: SceneData;
  panoramaUrl?: string;
  error?: string;
}

// ============================================
//  /api/sentiment
// ============================================

export interface SentimentRequest {
  messages: string[];
}

export interface SentimentResponse {
  success: boolean;
  /** Sentiment score from -1 (very sad) to 1 (very joyful) */
  sentiment?: number;
  /** Categorized mood */
  mood?: Mood;
  error?: string;
}

// ============================================
//  /api/generate-narration
// ============================================

export interface GenerateNarrationRequest {
  roomData: MemoryRoom;
  additionalContext?: string;
}

export interface GenerateNarrationResponse {
  success: boolean;
  narration?: string;
  audioUrl?: string;
  error?: string;
}

// ============================================
//  Common Error Types
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
}

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
