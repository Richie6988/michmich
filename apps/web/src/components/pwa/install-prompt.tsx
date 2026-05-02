'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'barry-pwa-install-dismissed';

/**
 * PWA install prompt banner (req 17 + Firefox CRITICAL_REVIEW UX gap 7).
 *
 * Detects when the browser fires the `beforeinstallprompt` event and shows
 * a small banner offering to install Barry as a PWA. Three browser paths:
 *  - Chrome/Edge/Samsung: programmatic prompt via beforeinstallprompt event
 *  - iOS Safari: manual instructions (Share -> Add to Home Screen)
 *  - Firefox: manual instructions (URL bar PWA install icon, Firefox 100+)
 *
 * The banner is dismissible and remembers the dismissal in localStorage so we
 * don't pester users.
 */
export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [browser, setBrowser] = useState<'chrome' | 'ios' | 'firefox' | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed?
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (standalone) {
      setIsStandalone(true);
      return;
    }

    // Already dismissed in last 30 days?
    try {
      const dismissedAt = window.localStorage.getItem(DISMISSED_KEY);
      if (dismissedAt) {
        const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (days < 30) return;
      }
    } catch { /* ignore */ }

    const ua = window.navigator.userAgent;

    // iOS detection (Safari doesn't fire beforeinstallprompt)
    const iosRegex = /iPad|iPhone|iPod/;
    if (iosRegex.test(ua) && !(window.navigator as any).MSStream) {
      setBrowser('ios');
      setDismissed(false);
      return;
    }

    // Firefox detection (doesn't fire beforeinstallprompt either)
    if (/Firefox\//.test(ua)) {
      setBrowser('firefox');
      setDismissed(false);
      return;
    }

    // Standard PWA install prompt event for Chrome/Edge/Samsung
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setBrowser('chrome');
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === 'accepted') {
      setInstallEvent(null);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch { /* ignore */ }
  };

  if (isStandalone || dismissed) return null;
  if (!installEvent && !browser) return null;

  const copy = (() => {
    if (browser === 'ios') return <>Tap <span className="font-bold">Share</span> then <span className="font-bold">Add to Home Screen</span> for one-tap access.</>;
    if (browser === 'firefox') return <>Click the <span className="font-bold">install icon</span> in the URL bar (right side) to add Barry to your apps.</>;
    return 'Get one-tap access from your home screen.';
  })();

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 barry-sheet-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-barry-blue to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">Install Barry</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {copy}
          </p>
          {browser === 'chrome' && installEvent && (
            <button
              onClick={handleInstall}
              className="mt-2 px-3 py-1.5 bg-barry-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
              Install
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          aria-label="Dismiss install prompt"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
