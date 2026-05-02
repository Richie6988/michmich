'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Avatar } from '@/components/ui/avatar';

const USER_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#0EA5E9', '#84CC16'];
function colorForUser(userId: string): string {
  if (!userId) return USER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash) + userId.charCodeAt(i);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

const QUICK_EMOJIS = ['+1', 'OK', 'Wait', 'Tonight?', 'Friday?', 'Yes', 'No'];

interface TripChatSidebarProps {
  tripId: string;
}

/**
 * Persistent chat sidebar (req 27).
 *
 * On desktop (xl: 1280px+): renders as a fixed right-side panel that scrolls
 * independently and stays visible while users browse other sections.
 *
 * On mobile/tablet (< 1280px): renders as a floating action button at the
 * bottom-right with a notification dot for unread messages. Tapping opens a
 * full-height bottom sheet that slides up from below.
 */
export function TripChatSidebar({ tripId }: TripChatSidebarProps) {
  const { chats, sendChatMessage, currentUser, trips } = useAppStore();
  const trip = trips.find(t => t.id === tripId);
  const messages = chats[tripId] || [];

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [lastReadCount, setLastReadCount] = useState(messages.length);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track unread count when sidebar is closed
  const unreadCount = open ? 0 : Math.max(0, messages.length - lastReadCount);

  // Mark as read when opening
  useEffect(() => {
    if (open) setLastReadCount(messages.length);
  }, [open, messages.length]);

  // Auto-scroll to bottom on new message (when not searching)
  useEffect(() => {
    if (scrollRef.current && !searchQuery) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, searchQuery]);

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : messages;

  const handleSend = () => {
    if (!input.trim()) return;
    sendChatMessage(tripId, input.trim());
    setInput('');
    setShowEmojiPanel(false);
  };

  const handleQuickEmoji = (text: string) => {
    sendChatMessage(tripId, text);
    setShowEmojiPanel(false);
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (d.getDate() === now.getDate()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diffDay = Math.floor(diffMin / 1440);
    if (diffDay < 2) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDay < 7) return `${diffDay}d`;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const highlightMatch = (content: string, query: string): React.ReactNode => {
    if (!query.trim()) return content;
    const idx = content.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return content;
    return (
      <>
        {content.slice(0, idx)}
        <mark className="bg-amber-200 dark:bg-amber-700 text-slate-900 dark:text-slate-100 rounded px-0.5">
          {content.slice(idx, idx + query.length)}
        </mark>
        {content.slice(idx + query.length)}
      </>
    );
  };

  if (!trip) return null;

  // Inner chat content shared between desktop sidebar and mobile bottom sheet
  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2.4" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight">Group chat</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {trip.participants.length} {trip.participants.length === 1 ? 'person' : 'people'} - {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQuery(''); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              searchOpen ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            }`}
            aria-label="Search"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          {/* Close button only on mobile */}
          <button
            onClick={() => setOpen(false)}
            className="xl:hidden w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center"
            aria-label="Close chat"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-1.5 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 text-white flex items-center justify-center"
                aria-label="Clear"
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {filteredMessages.length} {filteredMessages.length === 1 ? 'match' : 'matches'}
            </p>
          )}
        </div>
      )}

      {/* Messages — req 27: alternate left/right by sender */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 barry-scroll" role="log" aria-live="polite">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">
              {searchQuery.trim() ? 'No matches found.' : 'No messages yet. Say hi!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((m: any) => {
            const isMe = m.userId === currentUser?.id;
            const color = colorForUser(m.userId);
            return (
              <div key={m.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar user={m.user} size={26} className="mt-0.5 flex-shrink-0" />
                <div className={`flex-1 min-w-0 max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <p className="text-[10px] font-bold leading-tight" style={{ color: isMe ? '#64748B' : color }}>
                      {isMe ? 'You' : (m.user?.firstName || '?')}
                    </p>
                    <span
                      className="text-[9px] text-slate-400"
                      title={new Date(m.createdAt || Date.now()).toLocaleString()}
                    >
                      {formatTimestamp(m.createdAt || new Date())}
                    </span>
                  </div>
                  <div className={`mt-0.5 px-3 py-2 rounded-2xl text-xs leading-snug break-words ${
                    isMe
                      ? 'bg-barry-blue text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                  }`}>
                    {searchQuery.trim() ? highlightMatch(m.content, searchQuery) : m.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick emoji panel */}
      {showEmojiPanel && (
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 flex flex-wrap gap-1.5">
          {QUICK_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => handleQuickEmoji(e)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex gap-1.5 items-end">
          <button
            onClick={() => setShowEmojiPanel(p => !p)}
            className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-colors ${
              showEmojiPanel ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            aria-label="Quick reactions"
            title="Quick reactions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition flex-shrink-0"
            aria-label="Send message"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP: Persistent right rail (xl: 1280px+) */}
      <aside
        className="hidden xl:flex fixed right-0 top-14 bottom-0 w-[340px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-xl z-30 flex-col"
        aria-label="Group chat"
      >
        {chatContent}
      </aside>

      {/* MOBILE/TABLET: Floating action button */}
      <button
        onClick={() => setOpen(true)}
        className="xl:hidden fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-2xl shadow-cyan-500/40 flex items-center justify-center active:scale-95 transition-all"
        aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900 barry-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* MOBILE/TABLET: Bottom sheet when open */}
      {open && (
        <div
          className="xl:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end barry-dialog-fade"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col barry-sheet-up"
            style={{ height: '85vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            {chatContent}
          </div>
        </div>
      )}
    </>
  );
}
