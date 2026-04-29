'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { formatTimeShort } from '@/lib/utils/format-date';

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#F59E0B'];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { chats, sendMessage, currentUser, activeTrip, trips } = useAppStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const trip = activeTrip || trips.find(t => t.id === id);
  const messages = chats[id as string] || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(id as string, input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <BarryMascot mood="default" size={80} />
            <p className="text-sm text-slate-500 mt-4 text-center max-w-xs">
              Chat is empty for now.<br/>Start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userId === currentUser?.id;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const prev = messages[i - 1];
            const sameAuthorAsPrev = prev && prev.userId === msg.userId && prev.type !== 'system';
            const author = msg.user;
            const authorName = author?.firstName || 'Someone';
            const color = colorForUser(msg.userId);

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} ${sameAuthorAsPrev ? '-mt-1' : 'mt-3'}`}>
                {/* Avatar (only show on first message of a series) */}
                {!isMe && (
                  <div className="w-8 flex-shrink-0">
                    {!sameAuthorAsPrev && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {authorName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Author label - always show first message of series */}
                  {!sameAuthorAsPrev && (
                    <span
                      className="text-[11px] font-semibold mb-1 px-1"
                      style={{ color: isMe ? '#64748B' : color }}
                    >
                      {isMe ? 'You' : authorName}
                    </span>
                  )}

                  <div
                    className={`px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${
                      isMe
                        ? 'bg-barry-blue text-white rounded-br-md'
                        : 'bg-white text-slate-900 border border-slate-100 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                    {formatTimeShort(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-100 bg-white p-3 sticky bottom-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 rounded-full px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-barry-blue text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-transform shadow-md shadow-blue-500/20"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
