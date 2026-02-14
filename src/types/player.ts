/**
 * Player & Multiplayer Types
 * Data structures for multiplayer avatar system
 */

import type { Vector3 } from './room';

/** Available avatar styles */
export type AvatarStyle = 'astronaut' | 'robot' | 'ghost' | 'orb' | 'classic';

/** Avatar color options */
export type AvatarColor =
  | '#6366f1' // indigo
  | '#ec4899' // pink
  | '#14b8a6' // teal
  | '#f59e0b' // amber
  | '#8b5cf6' // violet
  | '#ef4444' // red
  | '#22c55e' // green
  | '#3b82f6'; // blue

/** A player in a multiplayer session */
export interface Player {
  /** Unique connection-based player ID */
  id: string;
  /** Display name */
  name: string;
  /** Avatar style */
  avatar: AvatarStyle;
  /** Avatar color */
  avatarColor: AvatarColor;
  /** Current 3D position [x, y, z] */
  position: Vector3;
  /** Current Y-axis rotation (radians) */
  rotation: number;
  /** Whether the player is currently active (not AFK) */
  isActive: boolean;
  /** Last activity timestamp */
  lastActive: Date;
}

/** Data sent when a player joins a room */
export interface PlayerJoinData {
  name: string;
  avatar: AvatarStyle;
  avatarColor: AvatarColor;
}

/** Player movement/position update */
export interface PlayerInput {
  /** New position */
  position: Vector3;
  /** New rotation */
  rotation: number;
}

/** Connection status */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/** WebSocket message types (client → server) */
export type ClientMessageType = 'JOIN' | 'MOVE' | 'CHAT' | 'UPDATE_MOOD' | 'PING';

/** WebSocket message types (server → client) */
export type ServerMessageType =
  | 'INIT'
  | 'PLAYER_JOINED'
  | 'PLAYER_MOVED'
  | 'PLAYER_LEFT'
  | 'CHAT_MESSAGE'
  | 'MOOD_CHANGE'
  | 'PONG'
  | 'ERROR';

/** Generic WebSocket message envelope */
export interface WSMessage<T = unknown> {
  type: ClientMessageType | ServerMessageType;
  payload: T;
  /** Timestamp of the message */
  timestamp: number;
}
