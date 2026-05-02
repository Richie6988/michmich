'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface DialogConfig {
  id: string;
  variant: 'info' | 'success' | 'warning' | 'danger' | 'question';
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel: boolean;
}

interface DialogContextValue {
  alert: (opts: { title: string; body?: string; variant?: DialogConfig['variant']; confirmLabel?: string }) => Promise<void>;
  confirm: (opts: { title: string; body?: string; variant?: DialogConfig['variant']; confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([]);

  const dismiss = useCallback((id: string) => {
    setDialogs(prev => prev.filter(d => d.id !== id));
  }, []);

  const alert = useCallback((opts: { title: string; body?: string; variant?: DialogConfig['variant']; confirmLabel?: string }): Promise<void> => {
    return new Promise<void>((resolve) => {
      const id = `dlg-${Date.now()}-${Math.random()}`;
      setDialogs(prev => [...prev, {
        id,
        variant: opts.variant || 'info',
        title: opts.title,
        body: opts.body,
        confirmLabel: opts.confirmLabel || 'Got it',
        showCancel: false,
        onConfirm: () => { dismiss(id); resolve(); },
      }]);
    });
  }, [dismiss]);

  const confirm = useCallback((opts: { title: string; body?: string; variant?: DialogConfig['variant']; confirmLabel?: string; cancelLabel?: string }): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const id = `dlg-${Date.now()}-${Math.random()}`;
      setDialogs(prev => [...prev, {
        id,
        variant: opts.variant || 'question',
        title: opts.title,
        body: opts.body,
        confirmLabel: opts.confirmLabel || 'Yes',
        cancelLabel: opts.cancelLabel || 'Cancel',
        showCancel: true,
        onConfirm: () => { dismiss(id); resolve(true); },
        onCancel: () => { dismiss(id); resolve(false); },
      }]);
    });
  }, [dismiss]);

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialogs.map(d => <DialogModal key={d.id} config={d} />)}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    // Fallback to native if used outside provider (shouldn't happen)
    return {
      alert: async (o: any) => { window.alert(o.body || o.title); },
      confirm: async (o: any) => window.confirm(o.body || o.title),
    } as DialogContextValue;
  }
  return ctx;
}

const VARIANT_STYLES = {
  info: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', btn: 'bg-blue-600 hover:bg-blue-700' },
  success: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', btn: 'bg-amber-600 hover:bg-amber-700' },
  danger: { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', btn: 'bg-rose-600 hover:bg-rose-700' },
  question: { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-700 dark:text-violet-300', btn: 'bg-violet-600 hover:bg-violet-700' },
};

const VARIANT_ICONS: Record<DialogConfig['variant'], React.ReactNode> = {
  info: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  success: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
  warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  danger: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  question: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
};

function DialogModal({ config }: { config: DialogConfig }) {
  const styles = VARIANT_STYLES[config.variant];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (config.showCancel) config.onCancel?.();
        else config.onConfirm?.();
      } else if (e.key === 'Enter') {
        config.onConfirm?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [config]);

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm barry-dialog-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`dlg-title-${config.id}`}
      onClick={() => {
        if (config.showCancel) config.onCancel?.();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 barry-dialog-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-12 h-12 rounded-2xl ${styles.bg} ${styles.text} flex items-center justify-center mb-3`}>
          {VARIANT_ICONS[config.variant]}
        </div>
        <h3 id={`dlg-title-${config.id}`} className="font-display font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-tight">
          {config.title}
        </h3>
        {config.body && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{config.body}</p>
        )}
        <div className={`flex gap-2 mt-5 ${config.showCancel ? '' : 'justify-end'}`}>
          {config.showCancel && (
            <button
              onClick={() => config.onCancel?.()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {config.cancelLabel}
            </button>
          )}
          <button
            onClick={() => config.onConfirm?.()}
            className={`flex-1 px-4 py-2.5 rounded-xl ${styles.btn} text-white font-bold text-sm transition-all active:scale-[0.97]`}
            autoFocus
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
