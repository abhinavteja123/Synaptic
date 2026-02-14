/**
 * Synaptic – Supabase Database Layer
 * All room, session, and user CRUD operations backed by Supabase PostgreSQL.
 * Exported function signatures are identical to the previous Dexie.js version
 * so every consumer works without changes.
 */

import { supabase } from '@/lib/supabase';
import type { MemoryRoom, RoomSession, Photo } from '@/types/room';

// ============================================
//  Type Conversions (camelCase ↔ snake_case)
// ============================================

/** Local user record – mirrors the "users" table */
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

/** Convert a Supabase row (snake_case) to a MemoryRoom (camelCase) */
function rowToRoom(row: Record<string, unknown>): MemoryRoom {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    tags: (row.tags as string[]) || [],
    photos: (row.photos as Photo[]) || [],
    sceneData: row.scene_data as MemoryRoom['sceneData'],
    audioNarration: row.audio_narration as string | undefined,
    narrationAudioUrl: row.narration_audio_url as string | undefined,
    theme: row.theme as string | undefined,
    collaborators: (row.collaborators as string[]) || [],
    inviteCode: row.invite_code as string | undefined,
    isPublic: row.is_public as boolean,
    isLegacy: row.is_legacy as boolean,
    lockedUntil: row.locked_until ? new Date(row.locked_until as string) : undefined,
    relationshipStory: row.relationship_story as string | undefined,
    entryMood: row.entry_mood as string | undefined,
    exitMood: row.exit_mood as string | undefined,
    location: row.location as string | undefined,
    legacyPersonName: row.legacy_person_name as string | undefined,
    legacyRelationship: row.legacy_relationship as string | undefined,
    visitCount: (row.visit_count as number) || 0,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/** Convert a MemoryRoom (camelCase) to a Supabase insert/update payload (snake_case) */
function roomToRow(room: MemoryRoom): Record<string, unknown> {
  // Only include fields with actual values to avoid errors from missing columns
  const row: Record<string, unknown> = {
    id: room.id,
    user_id: room.userId,
    title: room.title,
    description: room.description,
    tags: room.tags,
    photos: room.photos,
    scene_data: room.sceneData,
    is_public: room.isPublic,
    is_legacy: room.isLegacy,
    visit_count: room.visitCount,
    created_at: room.createdAt instanceof Date ? room.createdAt.toISOString() : room.createdAt,
    updated_at: new Date().toISOString(),
  };

  // Optional fields — only include when set
  if (room.audioNarration !== undefined) row.audio_narration = room.audioNarration;
  if (room.narrationAudioUrl !== undefined) row.narration_audio_url = room.narrationAudioUrl;
  if (room.theme !== undefined) row.theme = room.theme;
  if (room.collaborators?.length) row.collaborators = room.collaborators;
  if (room.inviteCode !== undefined) row.invite_code = room.inviteCode;
  if (room.lockedUntil !== undefined) row.locked_until = room.lockedUntil?.toISOString() ?? null;
  if (room.relationshipStory !== undefined) row.relationship_story = room.relationshipStory;
  if (room.entryMood !== undefined) row.entry_mood = room.entryMood;
  if (room.exitMood !== undefined) row.exit_mood = room.exitMood;
  if (room.legacyPersonName !== undefined) row.legacy_person_name = room.legacyPersonName;
  if (room.legacyRelationship !== undefined) row.legacy_relationship = room.legacyRelationship;
  if (room.location !== undefined) row.location = room.location;

  return row;
}

function rowToUser(row: Record<string, unknown>): UserRecord {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    passwordHash: row.password_hash as string,
    avatar: row.avatar as string | undefined,
    bio: row.bio as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function userToRow(user: UserRecord): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password_hash: user.passwordHash,
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
}

// ============================================
//  Room Helpers
// ============================================

/** Save or update a memory room (upsert) */
export async function saveRoom(room: MemoryRoom): Promise<string> {
  room.updatedAt = new Date();
  const row = roomToRow(room);
  const { error } = await supabase.from('rooms').upsert(row);
  if (error) {
    // If the error is about a missing column, try stripping optional columns one by one
    console.error('saveRoom error:', error.message);
    // Re-throw so callers can handle
    throw new Error(`saveRoom failed: ${error.message}`);
  }
  return room.id;
}

/** Get a single room by ID */
export async function getRoomById(id: string): Promise<MemoryRoom | undefined> {
  const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return rowToRoom(data);
}

/** Get all rooms for a specific user (owned + collaborator), newest first */
export async function getRoomsByUser(userId: string): Promise<MemoryRoom[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .or(`user_id.eq.${userId},collaborators.cs.{${userId}}`)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToRoom);
}

/** Get all public rooms */
export async function getPublicRooms(): Promise<MemoryRoom[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToRoom);
}

/** Delete a room by ID */
export async function deleteRoom(id: string): Promise<void> {
  // Sessions cascade-delete via FK
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) throw new Error(`deleteRoom failed: ${error.message}`);
}

/** Increment visit count */
export async function incrementVisitCount(id: string): Promise<void> {
  const { data } = await supabase.from('rooms').select('visit_count').eq('id', id).single();
  const current = (data?.visit_count as number) || 0;
  await supabase.from('rooms').update({ visit_count: current + 1, updated_at: new Date().toISOString() }).eq('id', id);
}

/** Add photos to an existing room */
export async function addPhotosToRoom(id: string, newPhotos: Photo[]): Promise<void> {
  const room = await getRoomById(id);
  if (!room) return;
  room.photos = [...room.photos, ...newPhotos];
  await saveRoom(room);
}

/** Remove a photo from a room by photo ID */
export async function removePhotoFromRoom(roomId: string, photoId: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;
  room.photos = room.photos.filter(p => p.id !== photoId);
  await saveRoom(room);
}

/** Update a photo caption in a room */
export async function updatePhotoCaption(roomId: string, photoId: string, caption: string): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) return;
  const photo = room.photos.find(p => p.id === photoId);
  if (photo) {
    photo.caption = caption;
    await saveRoom(room);
  }
}

// ============================================
//  Session Helpers
// ============================================

/** Save a multiplayer session */
export async function saveSession(session: RoomSession): Promise<string> {
  const row = {
    id: session.id,
    room_id: session.roomId,
    participants: session.participants,
    chat_history: session.chatHistory,
    current_mood: session.currentMood,
    started_at: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
  };
  const { error } = await supabase.from('sessions').upsert(row);
  if (error) throw new Error(`saveSession failed: ${error.message}`);
  return session.id;
}

/** Get sessions for a room */
export async function getSessionsByRoom(roomId: string): Promise<RoomSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('room_id', roomId)
    .order('started_at', { ascending: false });
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    roomId: row.room_id,
    participants: row.participants || [],
    chatHistory: row.chat_history || [],
    currentMood: row.current_mood || 'neutral',
    startedAt: new Date(row.started_at),
  }));
}

// ============================================
//  User Helpers
// ============================================

/** Save or update a user record */
export async function saveUser(user: UserRecord): Promise<void> {
  const { error } = await supabase.from('users').upsert(userToRow(user));
  if (error) throw new Error(`saveUser failed: ${error.message}`);
}

/** Get user by ID */
export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return rowToUser(data);
}

/** Get user by email */
export async function getUserByEmail(email: string): Promise<UserRecord | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .single();
  if (error || !data) return undefined;
  return rowToUser(data);
}

/** Update user name */
export async function updateUserName(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('users').update({ name }).eq('id', id);
  if (error) throw new Error(`updateUserName failed: ${error.message}`);
}

/** Update user bio */
export async function updateUserBio(id: string, bio: string): Promise<void> {
  const { error } = await supabase.from('users').update({ bio }).eq('id', id);
  if (error) throw new Error(`updateUserBio failed: ${error.message}`);
}

// ============================================
//  Legacy Compatibility
// ============================================
//  The old Dexie code exposed `db` directly.
//  Some files (useAuth.tsx, profile page) use `db.users.where(...)`.
//  We provide a thin compatibility object so those files still compile.
//  After migration, gradually remove direct `db.*` usage.
// ============================================

const usersProxy = {
  where: (field: string) => ({
    equalsIgnoreCase: (value: string) => ({
      first: async () => {
        const user = await getUserByEmail(value);
        return user;
      },
    }),
    equals: (value: string) => ({
      first: async () => {
        if (field === 'id') return getUserById(value);
        if (field === 'email') return getUserByEmail(value);
        return undefined;
      },
    }),
  }),
  put: async (user: UserRecord) => {
    await saveUser(user);
  },
  get: async (id: string) => {
    return getUserById(id);
  },
};

export const db = {
  users: usersProxy as unknown as {
    where: (field: string) => {
      equalsIgnoreCase: (value: string) => { first: () => Promise<UserRecord | undefined> };
      equals: (value: string) => { first: () => Promise<UserRecord | undefined> };
    };
    put: (user: UserRecord) => Promise<void>;
    get: (id: string) => Promise<UserRecord | undefined>;
  },
};

