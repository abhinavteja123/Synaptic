'use client';

/**
 * useMultiplayer – React hook for PartyKit multiplayer connection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import PartySocket from 'partysocket';
import type { Player } from '@/types/player';
import type { Mood } from '@/types/scene';
import type { ChatMessage } from '@/types/room';
import { MULTIPLAYER_SETTINGS } from '@/lib/constants';

interface UseMultiplayerOptions {
  roomId: string;
  playerName: string;
  avatar?: string;
  avatarColor?: string;
  enabled?: boolean;
}

interface UseMultiplayerReturn {
  players: Map<string, Player>;
  chatMessages: ChatMessage[];
  isConnected: boolean;
  connectionId: string | null;
  currentMood: Mood;
  sendPosition: (position: [number, number, number], rotation: number) => void;
  sendChat: (message: string) => void;
  updateMood: (mood: Mood) => void;
}

export function useMultiplayer({
  roomId,
  playerName,
  avatar = 'classic',
  avatarColor = '#6366f1',
  enabled = true,
}: UseMultiplayerOptions): UseMultiplayerReturn {
  const socketRef = useRef<PartySocket | null>(null);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');

  // Throttle position sends
  const lastPositionSend = useRef(0);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const host = process.env.NEXT_PUBLIC_PARTYKIT_URL || 'localhost:1999';
    const socket = new PartySocket({
      host,
      room: roomId,
    });

    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setIsConnected(true);
      setConnectionId(socket.id);

      // Send join message
      socket.send(JSON.stringify({
        type: 'JOIN',
        payload: { name: playerName, avatar, avatarColor },
      }));
    });

    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'INIT': {
          const initPlayers = new Map<string, Player>();
          for (const [id, p] of Object.entries(data.payload.players as Record<string, Player>)) {
            initPlayers.set(id, { ...p, lastActive: new Date() });
          }
          setPlayers(initPlayers);
          setCurrentMood(data.payload.currentMood || 'neutral');
          setChatMessages(
            (data.payload.chatHistory || []).map((m: ChatMessage) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          );
          break;
        }

        case 'PLAYER_JOINED': {
          const player = data.payload as Player;
          setPlayers((prev) => {
            const next = new Map(prev);
            next.set(player.id, { ...player, lastActive: new Date() });
            return next;
          });
          break;
        }

        case 'PLAYER_MOVED': {
          const { id, position, rotation } = data.payload;
          setPlayers((prev) => {
            const next = new Map(prev);
            const existing = next.get(id);
            if (existing) {
              next.set(id, { ...existing, position, rotation, isActive: true, lastActive: new Date() });
            }
            return next;
          });
          break;
        }

        case 'PLAYER_LEFT': {
          setPlayers((prev) => {
            const next = new Map(prev);
            next.delete(data.payload.id);
            return next;
          });
          break;
        }

        case 'CHAT_MESSAGE': {
          const msg: ChatMessage = {
            ...data.payload,
            timestamp: new Date(data.payload.timestamp),
          };
          setChatMessages((prev) => [...prev.slice(-49), msg]);
          break;
        }

        case 'MOOD_CHANGE': {
          setCurrentMood(data.payload.mood as Mood);
          break;
        }
      }
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
    });

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'PING', payload: {} }));
      }
    }, MULTIPLAYER_SETTINGS.heartbeatInterval);

    return () => {
      clearInterval(heartbeat);
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, playerName, avatar, avatarColor, enabled]);

  const sendPosition = useCallback(
    (position: [number, number, number], rotation: number) => {
      const now = Date.now();
      if (now - lastPositionSend.current < 1000 / MULTIPLAYER_SETTINGS.positionUpdateRate) return;
      lastPositionSend.current = now;

      socketRef.current?.send(
        JSON.stringify({ type: 'MOVE', payload: { position, rotation } }),
      );
    },
    [],
  );

  const sendChat = useCallback((message: string) => {
    if (!message.trim()) return;
    socketRef.current?.send(
      JSON.stringify({ type: 'CHAT', payload: { text: message.trim() } }),
    );
  }, []);

  const updateMood = useCallback((mood: Mood) => {
    socketRef.current?.send(
      JSON.stringify({ type: 'UPDATE_MOOD', payload: { mood } }),
    );
  }, []);

  return {
    players,
    chatMessages,
    isConnected,
    connectionId,
    currentMood,
    sendPosition,
    sendChat,
    updateMood,
  };
}
