/**
 * Scene & Environment Types
 * Types for 3D scene moods, weather, and environmental effects
 */

/** Emotional moods that affect the 3D environment */
export type Mood = 'joyful' | 'content' | 'neutral' | 'melancholic' | 'sad';

/** Weather effect types */
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';

/** Particle effect types */
export type ParticleType = 'sparkles' | 'rain' | 'fog' | 'dust' | 'confetti' | 'snow' | 'none';

/** Complete mood configuration for environment reactivity */
export interface MoodConfig {
  /** Mood identifier */
  mood: Mood;
  /** Display label */
  label: string;
  /** Primary mood color */
  color: string;
  /** Lighting overrides */
  lighting: {
    ambientColor: string;
    ambientIntensity: number;
    directionalColor: string;
    directionalIntensity: number;
    fogColor: string;
    fogDensity: number;
  };
  /** Weather effect */
  weather: WeatherType;
  /** Particle effects */
  particles: {
    type: ParticleType;
    intensity: number; // 0–1
    color: string;
  };
  /** Audio configuration */
  audio: {
    backgroundMusic: string;
    ambientSounds: string[];
    volume: number;
  };
  /** Post-processing effects */
  postProcessing: {
    bloom: number; // 0–2
    vignette: number; // 0–1
    saturation: number; // 0–2
    brightness: number; // 0–2
  };
}

/** Scene camera configuration */
export interface CameraConfig {
  /** Field of view in degrees */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Initial position [x, y, z] */
  initialPosition: [number, number, number];
  /** Look-at target */
  lookAt: [number, number, number];
}

/** Movement / controls configuration */
export interface MovementConfig {
  /** Walk speed (units/second) */
  walkSpeed: number;
  /** Run speed multiplier */
  runMultiplier: number;
  /** Mouse look sensitivity */
  mouseSensitivity: number;
  /** Enable jump */
  jumpEnabled: boolean;
  /** Jump force */
  jumpForce: number;
  /** Player height (eye level) */
  playerHeight: number;
}

/** Environment template definition */
export interface EnvironmentTemplate {
  /** Template name */
  name: string;
  /** Environment type */
  type: import('./room').EnvironmentType;
  /** Template description */
  description: string;
  /** Default objects for this environment */
  defaultObjects: import('./room').SceneObject[];
  /** Default lighting */
  defaultLighting: import('./room').LightingConfig;
  /** Default audio */
  defaultAudio: import('./room').AudioConfig;
  /** Suggested panorama prompt keywords */
  panoramaKeywords: string[];
}
