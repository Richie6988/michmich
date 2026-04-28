'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { chats, sendMessage, currentUser, activeTrip } = useAppStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12">
            <BarryMascot mood="default" size={80} />
            <p className="text-sm text-barry-grey mt-4 text-center max-w-xs">
              Le chat est vide pour le moment.<br/>Lance la conversation !
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === currentUser?.id;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="text-[11px] text-barry-grey bg-gray-100 px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-barry-coral flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {msg.user?.firstName?.[0]}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className="text-[10px] text-barry-grey mb-0.5 px-2">{msg.user?.firstName}</span>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2 text-sm ${
                    isMe
                      ? 'bg-barry-blue text-white rounded-tr-sm'
                      : 'bg-white text-barry-black border border-gray-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-barry-grey mt-1 px-2">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-3 sticky bottom-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ecris un message..."
            className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-barry-blue/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-barry-blue text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-transform"
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
