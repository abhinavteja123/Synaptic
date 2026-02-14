/**
 * PartyKit Server – Real-time multiplayer for Synaptic rooms
 * Handles player connections, movement sync, chat, and mood changes
 */

import type * as Party from 'partykit/server';

interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  position: [number, number, number];
  rotation: number;
  isActive: boolean;
}

interface RoomState {
  players: Record<string, PlayerState>;
  currentMood: string;
  chatHistory: Array<{
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
  }>;
}

export default class SynapticServer implements Party.Server {
  state: RoomState = {
    players: {},
    currentMood: 'neutral',
    chatHistory: [],
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send the current state to the new connection
    conn.send(
      JSON.stringify({
        type: 'INIT',
        payload: {
          players: this.state.players,
          currentMood: this.state.currentMood,
          chatHistory: this.state.chatHistory.slice(-20),
        },
        timestamp: Date.now(),
      }),
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    let parsed: { type: string; payload: Record<string, unknown> };
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }

    switch (parsed.type) {
      case 'JOIN': {
        const { name, avatar, avatarColor } = parsed.payload as {
          name: string;
          avatar: string;
          avatarColor: string;
        };

        // Add player (max 8)
        if (Object.keys(this.state.players).length >= 8) {
          sender.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Room is full (max 8 players)' }, timestamp: Date.now() }));
          return;
        }

        this.state.players[sender.id] = {
          id: sender.id,
          name: name || 'Anonymous',
          avatar: avatar || 'classic',
          avatarColor: avatarColor || '#6366f1',
          position: [0, 1.6, 5],
          rotation: 0,
          isActive: true,
        };

        // Broadcast to others
        this.broadcast(
          JSON.stringify({
            type: 'PLAYER_JOINED',
            payload: this.state.players[sender.id],
            timestamp: Date.now(),
          }),
          [sender.id],
        );
        break;
      }

      case 'MOVE': {
        const { position, rotation } = parsed.payload as {
          position: [number, number, number];
          rotation: number;
        };
        if (this.state.players[sender.id]) {
          this.state.players[sender.id].position = position;
          this.state.players[sender.id].rotation = rotation;
          this.state.players[sender.id].isActive = true;

          this.broadcast(
            JSON.stringify({
              type: 'PLAYER_MOVED',
              payload: { id: sender.id, position, rotation },
              timestamp: Date.now(),
            }),
            [sender.id],
          );
        }
        break;
      }

      case 'CHAT': {
        const { text } = parsed.payload as { text: string };
        if (!text || text.length > 500) return;

        const msg = {
          id: `${sender.id}-${Date.now()}`,
          senderId: sender.id,
          senderName: this.state.players[sender.id]?.name || 'Unknown',
          text,
          timestamp: Date.now(),
        };

        this.state.chatHistory.push(msg);
        if (this.state.chatHistory.length > 50) {
          this.state.chatHistory = this.state.chatHistory.slice(-50);
        }

        this.broadcast(
          JSON.stringify({ type: 'CHAT_MESSAGE', payload: msg, timestamp: Date.now() }),
        );
        break;
      }

      case 'UPDATE_MOOD': {
        const { mood } = parsed.payload as { mood: string };
        this.state.currentMood = mood;
        this.broadcast(
          JSON.stringify({ type: 'MOOD_CHANGE', payload: { mood }, timestamp: Date.now() }),
        );
        break;
      }

      case 'PING': {
        sender.send(JSON.stringify({ type: 'PONG', payload: {}, timestamp: Date.now() }));
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    delete this.state.players[conn.id];
    this.broadcast(
      JSON.stringify({
        type: 'PLAYER_LEFT',
        payload: { id: conn.id },
        timestamp: Date.now(),
      }),
    );
  }

  /** Broadcast to all connections, optionally excluding some */
  private broadcast(message: string, exclude?: string[]) {
    for (const conn of this.room.getConnections()) {
      if (!exclude || !exclude.includes(conn.id)) {
        conn.send(message);
      }
    }
  }
}
