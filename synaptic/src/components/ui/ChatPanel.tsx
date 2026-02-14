'use client';

/**
 * ChatPanel.tsx – In-room text chat as floating icon + expandable panel
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import type { ChatMessage } from '@/types/room';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  localPlayerId?: string;
  isConnected: boolean;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  localPlayerId,
  isConnected,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track unread messages when panel is closed
  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      setUnread(prev => prev + (messages.length - prevCountRef.current));
    }
    prevCountRef.current = messages.length;
  }, [messages.length, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  // Player name colors
  const nameColors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa', '#fb923c', '#22d3ee'];
  const getNameColor = (senderId: string) => {
    const hash = senderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return nameColors[hash % nameColors.length];
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Chat Panel (expanded) */}
      {open && (
        <div className="w-80 max-w-[calc(100vw-2rem)] mb-3 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl bg-black/80 backdrop-blur-md border border-white/10 border-b-0 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white/80 font-medium">Chat</span>
              {!isConnected && <span className="text-[10px] text-red-400/70">(offline)</span>}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-black/80 backdrop-blur-md rounded-b-xl border border-white/10 border-t-0">
            {/* Message list */}
            <div ref={scrollRef} className="h-56 overflow-y-auto px-3 py-2 space-y-1.5 text-sm">
              {messages.length === 0 && (
                <p className="text-white/25 text-xs text-center pt-16">
                  No messages yet. Say hello! 👋
                </p>
              )}
              {messages.map((msg) => {
                const isOwn = msg.senderId === localPlayerId;
                return (
                  <div key={msg.id} className={`${isOwn ? 'text-right' : ''}`}>
                    <span style={{ color: getNameColor(msg.senderId) }} className="text-xs font-medium">
                      {isOwn ? 'You' : msg.senderName}
                    </span>
                    <p className="text-white/80 break-words text-[13px]">{msg.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isConnected ? 'Type a message…' : 'Disconnected'}
                disabled={!isConnected}
                maxLength={500}
                className="flex-1 bg-white/[0.06] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 outline-none disabled:opacity-40 focus:bg-white/[0.08] transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!isConnected || !input.trim()}
                className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/30 disabled:opacity-30 transition-all"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Icon */}
      {!open && (
        <button
          onClick={handleOpen}
          className="relative w-12 h-12 rounded-full bg-purple-500/20 backdrop-blur-md border border-purple-400/30 flex items-center justify-center text-purple-400 hover:bg-purple-500/30 hover:scale-105 transition-all shadow-lg shadow-purple-500/10"
        >
          <MessageCircle className="h-5 w-5" />
          {/* Unread badge */}
          {unread > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-pink-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>
            </div>
          )}
          {/* Connection dot */}
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black/50 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </button>
      )}
    </div>
  );
}
