'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';
import { useDialog } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function DataRightsPage() {
  const { currentUser, logout } = useAppStore();
  const { confirm: showConfirm, alert: showAlert } = useDialog();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const handleDownload = () => {
    if (typeof window === 'undefined') return;
    setBusy(true);
    try {
      // Build a JSON dump of localStorage state
      const dump: Record<string, any> = {};
      const stateRaw = window.localStorage.getItem('barry-app-state');
      if (stateRaw) dump.app_state = JSON.parse(stateRaw);
      const credsRaw = window.localStorage.getItem('barry-credentials');
      if (credsRaw) dump.credentials = '(omitted for security)';
      dump.exportedAt = new Date().toISOString();
      dump.note = 'This is a local export. In production, /api/v1/users/me/export returns a complete server-side archive (GDPR Article 20).';

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
      body: 'This permanently erases your profile, trips, expenses, and chat history. This action cannot be undone.',
      variant: 'danger',
      confirmLabel: 'Yes, delete forever',
      cancelLabel: 'Keep my account',
    });
    if (!ok) return;
    const ok2 = await showConfirm({
      title: 'One last check',
      body: 'Type-and-tap confirm: this will end your session, delete your data on this device, and queue server-side deletion. Continue?',
      variant: 'danger',
      confirmLabel: 'Delete forever',
      cancelLabel: 'Cancel',
    });
    if (!ok2) return;

    setBusy(true);
    try {
      // In production: await api.users.delete(); — backend cascades trips/expenses/etc.
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('barry-app-state');
        window.localStorage.removeItem('barry-credentials');
        window.localStorage.removeItem('barry-reset-requests');
      }
      logout();
      await showAlert({
        title: 'Account deleted',
        body: 'Your local data has been cleared. We&rsquo;ll process the server-side deletion within 30 days.',
        variant: 'success',
      });
      router.push('/' as any);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-slate-100 tracking-tight mb-2">My data</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
        Under GDPR (EU 2016/679), you have the right to access, port, and delete your personal data at any time.
      </p>

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-barry-blue flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Download my data</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export everything we have on you as a JSON file (GDPR Article 20).
            </p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-barry-blue text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-40"
        >
          {busy ? 'Preparing...' : 'Download my data'}
        </button>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Delete my account</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently erase everything (GDPR Article 17, &ldquo;right to be forgotten&rdquo;).
            </p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-snug">
          This deletes your profile, all trips you organized or joined, your chat history, expenses, and saved
          payment methods. We cannot recover this. Your share of group trips will be anonymized but the trip
          itself stays accessible to other participants.
        </p>
        <button
          onClick={handleDelete}
          disabled={busy || !currentUser}
          className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 active:scale-[0.99] transition-all disabled:opacity-40"
        >
          {busy ? 'Working...' : 'Delete my account'}
        </button>
      </section>

      <section className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        <p>
          For other rights (correction, restriction, objection, portability), email us at{' '}
          <a href="mailto:privacy@barry.app" className="text-barry-blue underline">privacy@barry.app</a>{' '}
          or write to our DPO at the address in our <a href="/legal/privacy" className="text-barry-blue underline">privacy policy</a>.
        </p>
        <p className="mt-2">
          We respond to all requests within 30 days. You also have the right to lodge a complaint with the CNIL
          (French data protection authority) at <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-barry-blue underline">cnil.fr</a>.
        </p>
      </section>
    </div>
  );
}
