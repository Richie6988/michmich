'use client';

import React, { useState, useEffect } from 'react';

const CONSENT_KEY = 'barry-cookie-consent-v1';

export interface CookieConsent {
  essential: true; // always true, can't disable
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearConsent() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(CONSENT_KEY); } catch { /* ignore */ }
}

/**
 * GDPR-compliant cookie consent banner.
 *
 * Shows on first visit. Three categories the user can independently toggle:
 *  - functional (preferences, language)
 *  - analytics (Plausible if enabled)
 *  - marketing (none today, reserved)
 * Essential cookies (auth, CSRF) are always on and cannot be disabled.
 *
 * Stores consent under barry-cookie-consent-v1 with timestamp and per-category
 * booleans. Analytics scripts should check `getStoredConsent()?.analytics`
 * before loading.
 */
export function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = getStoredConsent();
    if (!stored) setShow(true);
  }, []);

  const persistConsent = (c: Omit<CookieConsent, 'essential' | 'acceptedAt'>) => {
    const consent: CookieConsent = {
      essential: true,
      functional: c.functional,
      analytics: c.analytics,
      marketing: c.marketing,
      acceptedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    } catch { /* ignore */ }
    setShow(false);
  };

  const handleAcceptAll = () => persistConsent({ functional: true, analytics: true, marketing: true });
  const handleRejectAll = () => persistConsent({ functional: false, analytics: false, marketing: false });
  const handleSavePrefs = () => persistConsent({ functional, analytics, marketing });

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-slate-900 border-t-2 border-barry-blue shadow-2xl barry-sheet-up" role="dialog" aria-label="Cookie consent">
      <div className="max-w-4xl mx-auto p-4 sm:p-5">
        {!showCustomize ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">We respect your data</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                We use essential cookies to keep you signed in and your trip data safe. With your consent, we&rsquo;d also like to use analytics to improve Barry. You can change your mind any time in settings.{' '}
                <a href="/legal/data-rights" className="text-barry-blue font-bold hover:underline">Learn more</a>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                onClick={() => setShowCustomize(true)}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Reject all
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-barry-blue hover:bg-blue-700 active:scale-95 transition-all"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">Cookie preferences</p>
              <button
                onClick={() => setShowCustomize(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Back
              </button>
            </div>
            <div className="space-y-2.5 mb-3">
              <ConsentRow
                title="Essential"
                desc="Login, security, fundamental app function. Always on."
                checked={true}
                disabled
                onChange={() => undefined}
              />
              <ConsentRow
                title="Functional"
                desc="Remember your language and preferences."
                checked={functional}
                onChange={setFunctional}
              />
              <ConsentRow
                title="Analytics"
                desc="Help us understand how Barry is used so we can improve."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ConsentRow
                title="Marketing"
                desc="Currently unused. Reserved for future referral program."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={handleRejectAll}
                className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Reject all
              </button>
              <button
                onClick={handleSavePrefs}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-barry-blue hover:bg-blue-700 active:scale-95 transition-all"
              >
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentRow({ title, desc, checked, disabled, onChange }: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-barry-blue focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
      />
      <div className="flex-1">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}{disabled && <span className="text-[10px] text-slate-400 font-medium ml-2">required</span>}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{desc}</p>
      </div>
    </label>
  );
}
