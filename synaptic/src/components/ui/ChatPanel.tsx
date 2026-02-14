'use client';

/**
 * ChatPanel.tsx – In-room text chat overlay
 */

import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  // Player name colors (rotate through these)
  const nameColors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa', '#fb923c', '#22d3ee'];
  const getNameColor = (senderId: string) => {
    const hash = senderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return nameColors[hash % nameColors.length];
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between rounded-t-xl glass-dark px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
      >
        <span>Chat {!isConnected && '(disconnected)'}</span>
        {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {!collapsed && (
        <div className="glass-dark rounded-b-xl border-t border-white/5">
          {/* Message list */}
          <div ref={scrollRef} className="h-52 overflow-y-auto px-3 py-2 space-y-1.5 text-sm">
            {messages.length === 0 && (
              <p className="text-white/30 text-xs text-center pt-8">
                No messages yet. Say hello!
              </p>
            )}
            {messages.map((msg) => {
              const isOwn = msg.senderId === localPlayerId;
              return (
                <div key={msg.id} className={`${isOwn ? 'text-right' : ''}`}>
                  <span style={{ color: getNameColor(msg.senderId) }} className="text-xs font-medium">
                    {isOwn ? 'You' : msg.senderName}
                  </span>
                  <p className="text-white/80 break-words">{msg.text}</p>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Type a message…' : 'Disconnected'}
              disabled={!isConnected}
              maxLength={500}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none disabled:opacity-40"
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              className="text-primary-400 hover:text-primary-300 disabled:text-white/20 transition-colors"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
