'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDialog } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

/**
 * Consolidated legal page (Wave 25).
 *
 * Replaces the previous separate pages:
 *   - /legal/terms
 *   - /legal/privacy
 *   - /legal/cookies
 *   - /legal/data-rights
 *
 * All now live here, separated by collapsible sections so users find what
 * they need without bouncing between pages. The links from profile and the
 * cookie consent banner all point to /legal.
 */
export default function LegalPage() {
  const { currentUser, logout, preferences } = useAppStore();
  const { confirm: showConfirm, alert: showAlert } = useDialog();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const lastUpdated = 'May 2026';

  const handleDownload = () => {
    if (typeof window === 'undefined') return;
    setBusy(true);
    try {
      const dump: Record<string, any> = {};
      const stateRaw = window.localStorage.getItem('barry-app-state');
      if (stateRaw) dump.app_state = JSON.parse(stateRaw);
      dump.exportedAt = new Date().toISOString();
      dump.note = 'Local export. In production, /api/v1/users/me/export returns a complete server-side archive (GDPR Article 20).';

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barry-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await showConfirm({
      title: 'Delete your account?',
      body: 'This will permanently delete your Barry account and all your data: trips, votes, expenses, photos. This cannot be undone.',
      variant: 'danger',
      confirmLabel: 'I understand, delete forever',
      cancelLabel: 'Keep my account',
    });
    if (!ok) return;
    const confirmAgain = await showConfirm({
      title: 'Are you really sure?',
      body: 'One last check. Your friends won&rsquo;t be able to mention you in their Barry plans anymore.',
      variant: 'danger',
      confirmLabel: 'Yes, delete now',
      cancelLabel: 'Actually, keep it',
    });
    if (!confirmAgain) return;

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('barry-app-state');
        window.localStorage.removeItem('barry-credentials');
        window.localStorage.removeItem('barry-reset-requests');
        window.localStorage.removeItem('barry-cookie-consent-v1');
      }
      logout();
      await showAlert({
        title: 'Account deleted',
        body: 'Your data has been removed. Sorry to see you go.',
        variant: 'info',
      });
      router.push('/');
    } catch {
      await showAlert({
        title: 'Hmm, something went wrong',
        body: 'Please contact privacy@barry.app and we&rsquo;ll handle it manually.',
        variant: 'warning',
      });
    }
  };

  const handleClearConsent = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('barry-cookie-consent-v1');
    window.location.reload();
  };

  return (
    <>
      <h1 className="font-display font-extrabold text-2xl text-slate-900 dark:text-slate-100 mb-1">
        Legal & privacy
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last updated: {lastUpdated}</p>

      {/* Quick TOC */}
      <nav className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Jump to</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <a href="#terms" className="text-barry-blue font-semibold hover:underline">Terms of use</a>
          <span className="text-slate-300">-</span>
          <a href="#privacy" className="text-barry-blue font-semibold hover:underline">Privacy</a>
          <span className="text-slate-300">-</span>
          <a href="#cookies" className="text-barry-blue font-semibold hover:underline">Cookies</a>
          <span className="text-slate-300">-</span>
          <a href="#data-rights" className="text-barry-blue font-semibold hover:underline">My data</a>
        </div>
      </nav>

      {/* ====== TERMS OF USE ====== */}
      <section id="terms" className="scroll-mt-20">
        <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mt-2 mb-3">Terms of use</h2>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">1. What Barry does</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Barry helps groups of people find a fair meeting point and coordinate a meetup. You provide
          your home location and travel preferences; Barry computes equitable options. You vote on a
          location, fund the trip together, and Barry helps you book it.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">2. Your account</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          You&rsquo;re responsible for keeping your password safe. Don&rsquo;t share your account with
          others. Tell us right away if you think someone has accessed it without permission.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">3. Acceptable use</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Don&rsquo;t use Barry to harass others, share illegal content, or attempt to break the service.
          We can suspend accounts that misuse it.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">4. Bookings & payments</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Barry facilitates bookings via third-party providers (transport, hotels, restaurants). The
          terms of those providers apply for actual reservations. Barry takes a small service fee
          per booking; this is shown transparently before you confirm.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">5. Liability</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          We do our best to keep Barry working, but we can&rsquo;t guarantee uninterrupted service.
          We&rsquo;re not liable for travel disruptions, missed connections, or disputes between group
          members. Barry is a planning tool, not a travel insurer.
        </p>
      </section>

      {/* ====== PRIVACY ====== */}
      <section id="privacy" className="scroll-mt-20 mt-8">
        <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mb-3">Privacy</h2>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">What we collect</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside space-y-1">
          <li>Account info: your name, email, password (hashed with Argon2)</li>
          <li>Your home location (so Barry can find fair meeting spots)</li>
          <li>Trip data: who you invited, where you voted, what you booked</li>
          <li>Standard server logs for security and abuse prevention</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">What we don&rsquo;t do</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside space-y-1">
          <li>We don&rsquo;t sell your data, ever</li>
          <li>We don&rsquo;t share your contacts with anyone</li>
          <li>We don&rsquo;t track you across other sites</li>
        </ul>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">Who processes your data</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Hosting: Vercel and AWS (EU regions). Maps: OpenStreetMap (Nominatim, Carto Voyager) and
          ESRI for satellite tiles. Payments: Stripe. None of these have access to your data beyond
          what&rsquo;s needed to deliver the service.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">Contact</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Questions about your privacy? Write to <strong>privacy@barry.app</strong>. We aim to reply
          within 5 business days. You can also contact the French data protection authority:{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-barry-blue font-semibold hover:underline">www.cnil.fr</a>.
        </p>
      </section>

      {/* ====== COOKIES ====== */}
      <section id="cookies" className="scroll-mt-20 mt-8">
        <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mb-3">Cookies</h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          We use cookies and similar browser storage to keep you signed in, remember your preferences,
          and (with your consent) understand how Barry is used so we can improve it.
        </p>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">Categories</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside space-y-1">
          <li><strong>Essential</strong> - login session, security tokens, app state. Always on, can&rsquo;t be disabled.</li>
          <li><strong>Functional</strong> - language, theme, transport preferences. You can toggle these off.</li>
          <li><strong>Analytics</strong> - off by default. We only enable them with your explicit consent.</li>
          <li><strong>Marketing</strong> - currently unused. Reserved for a future referral program.</li>
        </ul>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
          We don&rsquo;t use any third-party advertising cookies.
        </p>

        <button
          onClick={handleClearConsent}
          className="mt-3 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
        >
          Change my cookie choices
        </button>
      </section>

      {/* ====== DATA RIGHTS ====== */}
      <section id="data-rights" className="scroll-mt-20 mt-8">
        <h2 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 mb-3">My data (GDPR rights)</h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Under GDPR (Articles 15-21), you have the right to access, correct, export, and delete your data.
        </p>

        {/* Download */}
        <div className="mt-4 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-blue-50/40 dark:bg-blue-950/30">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">Download my data (Article 20)</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 mb-3 leading-relaxed">
            Get a JSON archive of everything we have about you: trips, votes, expenses, preferences.
          </p>
          <button
            onClick={handleDownload}
            disabled={busy || !currentUser}
            className="px-4 py-2 rounded-xl bg-barry-blue text-white text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Preparing...' : 'Download my data'}
          </button>
        </div>

        {/* Delete */}
        <div className="mt-3 rounded-2xl border border-rose-100 dark:border-rose-900 p-4 bg-rose-50/40 dark:bg-rose-950/30">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">Delete my account (Article 17)</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 mb-3 leading-relaxed">
            Permanently remove your account and all data. Your friends&rsquo; trips remain but you&rsquo;ll
            be shown as &ldquo;Anonymous&rdquo; in shared history. This is irreversible.
          </p>
          <button
            onClick={handleDelete}
            disabled={!currentUser}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete my account
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
          For other rights (correction, restriction, objection, portability beyond JSON), email{' '}
          <strong>privacy@barry.app</strong>. We reply within 30 days max as required by GDPR.
        </p>
      </section>
    </>
  );
}
