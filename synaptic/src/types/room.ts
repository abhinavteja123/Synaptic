/**
 * Room & Memory Types
 * Core data structures for Synaptic memory rooms
 */

/** Unique identifier type */
export type RoomId = string;
export type UserId = string;
export type PhotoId = string;

/** A single uploaded photo in a memory */
export interface Photo {
  /** Unique photo ID */
  id: PhotoId;
  /** Base64-encoded image data or URL */
  url: string;
  /** Optional user-provided caption */
  caption?: string;
  /** Original filename */
  filename?: string;
  /** When the photo was taken (if available from EXIF) */
  takenAt?: Date;
  /** When the photo was uploaded */
  uploadedAt: Date;
  /** Image dimensions */
  width?: number;
  height?: number;
}

/** 3D position vector */
export type Vector3 = [number, number, number];

/** Types of 3D objects that can appear in a scene */
export type SceneObjectType = 'model' | 'photo' | 'text' | 'primitive';

/** Primitive shape types */
export type PrimitiveShape = 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus';

/** A single object placed in the 3D scene */
export interface SceneObject {
  /** Unique object ID */
  id: string;
  /** Object type */
  type: SceneObjectType;
  /** Display name for the object */
  name: string;
  /** Position in 3D space [x, y, z] */
  position: Vector3;
  /** Rotation in radians [x, y, z] */
  rotation: Vector3;
  /** Scale [x, y, z] */
  scale: Vector3;
  /** URL to GLTF/GLB model (for type 'model') */
  modelUrl?: string;
  /** URL to texture image (for type 'photo') */
  textureUrl?: string;
  /** Text content (for type 'text') */
  text?: string;
  /** Primitive shape type */
  shape?: PrimitiveShape;
  /** Material color (hex) */
  color?: string;
  /** Material opacity (0-1) */
  opacity?: number;
  /** Whether the object casts shadows */
  castShadow?: boolean;
  /** Whether the object receives shadows */
  receiveShadow?: boolean;
  /** Interactive: related memory text shown on click */
  memoryText?: string;
  /** Is this object clickable/interactive */
  interactive?: boolean;
}

/** Lighting configuration for a scene */
export interface LightingConfig {
  /** Ambient light color (hex) */
  ambientColor: string;
  /** Ambient light intensity (0-2) */
  ambientIntensity: number;
  /** Directional (sun/moon) light color */
  directionalColor: string;
  /** Directional light intensity */
  directionalIntensity: number;
  /** Directional light position */
  directionalPosition: Vector3;
  /** Enable shadows */
  shadowsEnabled: boolean;
  /** Optional point lights */
  pointLights?: Array<{
    position: Vector3;
    color: string;
    intensity: number;
    distance: number;
  }>;
  /** Fog color */
  fogColor?: string;
  /** Fog near distance */
  fogNear?: number;
  /** Fog far distance */
  fogFar?: number;
}

/** Audio configuration for ambiance */
export interface AudioConfig {
  /** Background music track identifier */
  backgroundMusic?: string;
  /** Ambient sound effects */
  ambientSounds: string[];
  /** Master volume (0-1) */
  volume: number;
}

/** Supported pre-built environment types */
export type EnvironmentType = 'cafe' | 'kitchen' | 'bedroom' | 'park' | 'living-room' | 'workshop' | 'custom';

/** Complete scene data for rendering a 3D room */
export interface SceneData {
  /** Environment template type */
  environmentType: EnvironmentType;
  /** URL to equirectangular panorama for skybox */
  panoramaUrl: string;
  /** All objects in the scene */
  objects: SceneObject[];
  /** Lighting configuration */
  lighting: LightingConfig;
  /** Audio configuration */
  audio: AudioConfig;
  /** Dominant colors from photo analysis (hex) */
  dominantColors?: string[];
}

/** A complete Memory Room */
export interface MemoryRoom {
  /** Unique room ID */
  id: RoomId;
  /** Owner's user ID */
  userId: UserId;
  /** Room title */
  title: string;
  /** User-provided description of the memory */
  description: string;
  /** Tags for organization */
  tags: string[];
  /** Uploaded photos */
  photos: Photo[];
  /** Generated 3D scene data */
  sceneData: SceneData;
  /** AI-generated narration text (for Legacy Mode) */
  audioNarration?: string;
  /** TTS audio URL for narration */
  narrationAudioUrl?: string;
  /** Whether this room is publicly accessible */
  isPublic: boolean;
  /** Whether this is a Legacy Mode room */
  isLegacy: boolean;
  /** Legacy mode: person's name */
  legacyPersonName?: string;
  /** Legacy mode: relationship */
  legacyRelationship?: string;
  /** Number of times this room has been visited */
  visitCount: number;
  /** When the room was created */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/** Multiplayer session for a room */
export interface RoomSession {
  /** Session ID */
  id: string;
  /** Associated room */
  roomId: RoomId;
  /** Active participants */
  participants: string[];
  /** Chat message history */
  chatHistory: ChatMessage[];
  /** Current shared mood state */
  currentMood: import('./scene').Mood;
  /** When the session started */
  startedAt: Date;
}

/** A chat message in a multiplayer session */
export interface ChatMessage {
  /** Message ID */
  id: string;
  /** Sender's player ID */
  senderId: string;
  /** Sender's display name */
  senderName: string;
  /** Message text */
  text: string;
  /** When the message was sent */
  timestamp: Date;
}
