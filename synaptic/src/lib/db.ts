/**
 * Synaptic – Dexie.js Database
 * Client-side IndexedDB storage for rooms, sessions, and user data.
 */

import Dexie, { type Table } from 'dexie';
import type { MemoryRoom, RoomSession, ChatMessage } from '@/types/room';
import type { Mood } from '@/types/scene';

// ============================================
//  Database Schema
// ============================================

export class SynapticDB extends Dexie {
  rooms!: Table<MemoryRoom, string>;
  sessions!: Table<RoomSession, string>;
  users!: Table<UserRecord, string>;

  constructor() {
    super('SynapticDB');

    this.version(1).stores({
      rooms: 'id, userId, title, isPublic, createdAt, updatedAt',
      sessions: 'id, roomId, startedAt',
      users: 'id, email, name, createdAt',
    });

    // v2: add email index for login lookup
    this.version(2).stores({
      rooms: 'id, userId, title, isPublic, createdAt, updatedAt',
      sessions: 'id, roomId, startedAt',
      users: 'id, &email, name, createdAt',
    });
  }
}

/** Local user record */
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  createdAt: Date;
}

// Singleton database instance
export const db = new SynapticDB();

// ============================================
//  Room Helpers
// ============================================

/** Save or update a memory room */
export async function saveRoom(room: MemoryRoom): Promise<string> {
  room.updatedAt = new Date();
  await db.rooms.put(room);
  return room.id;
}

/** Get a single room by ID */
export async function getRoomById(id: string): Promise<MemoryRoom | undefined> {
  return db.rooms.get(id);
}

/** Get all rooms for a specific user, newest first */
export async function getRoomsByUser(userId: string): Promise<MemoryRoom[]> {
  return db.rooms.where('userId').equals(userId).reverse().sortBy('createdAt');
}

/** Get all public rooms */
export async function getPublicRooms(): Promise<MemoryRoom[]> {
  return db.rooms.filter((room) => room.isPublic === true).reverse().sortBy('createdAt');
}

/** Delete a room by ID */
export async function deleteRoom(id: string): Promise<void> {
  await db.rooms.delete(id);
  // Also clean up associated sessions
  const sessions = await db.sessions.where('roomId').equals(id).toArray();
  await db.sessions.bulkDelete(sessions.map((s) => s.id));
}

/** Increment visit count */
export async function incrementVisitCount(id: string): Promise<void> {
  await db.rooms.where('id').equals(id).modify((room) => {
    room.visitCount = (room.visitCount || 0) + 1;
  });
}

/** Add photos to an existing room */
export async function addPhotosToRoom(id: string, newPhotos: import('@/types/room').Photo[]): Promise<void> {
  await db.rooms.where('id').equals(id).modify((room) => {
    room.photos = [...(room.photos || []), ...newPhotos];
    room.updatedAt = new Date();
  });
}

/** Remove a photo from a room by photo ID */
export async function removePhotoFromRoom(roomId: string, photoId: string): Promise<void> {
  await db.rooms.where('id').equals(roomId).modify((room) => {
    room.photos = (room.photos || []).filter(p => p.id !== photoId);
    room.updatedAt = new Date();
  });
}

/** Update a photo caption in a room */
export async function updatePhotoCaption(roomId: string, photoId: string, caption: string): Promise<void> {
  await db.rooms.where('id').equals(roomId).modify((room) => {
    const photo = (room.photos || []).find(p => p.id === photoId);
    if (photo) {
      photo.caption = caption;
      room.updatedAt = new Date();
    }
  });
}

// ============================================
//  Session Helpers
// ============================================

/** Save a multiplayer session */
export async function saveSession(session: RoomSession): Promise<string> {
  await db.sessions.put(session);
  return session.id;
}

/** Get sessions for a room */
export async function getSessionsByRoom(roomId: string): Promise<RoomSession[]> {
  return db.sessions.where('roomId').equals(roomId).reverse().sortBy('startedAt');
}

// ============================================
//  User Helpers
// ============================================

/** Save or update a user record */
export async function saveUser(user: UserRecord): Promise<void> {
  await db.users.put(user);
}

/** Get user by ID */
export async function getUserById(id: string): Promise<UserRecord | undefined> {
  return db.users.get(id);
}

/** Get user by email */
export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  return db.users.where('email').equalsIgnoreCase(email).first();
}
