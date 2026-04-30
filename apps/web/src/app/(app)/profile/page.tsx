'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMark } from '@/components/barry/brand';
import { Avatar } from '@/components/ui/avatar';
import { CARD_PROVIDERS } from '@/lib/data/reduction-cards';
import type { ReductionCard } from '@barry/shared-types';

const TRANSPORT_OPTIONS = [
  { value: 'walk' as const, label: 'Walk' },
  { value: 'bike' as const, label: 'Bike' },
  { value: 'transit' as const, label: 'Public transit' },
  { value: 'car' as const, label: 'Car' },
  { value: 'train' as const, label: 'Train' },
  { value: 'flight' as const, label: 'Flight' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en' as const, label: 'English' },
  { value: 'fr' as const, label: 'Francais' },
  { value: 'es' as const, label: 'Espanol' },
];

export default function ProfilePage() {
  const router = useRouter();
  const {
    currentUser, preferences, updatePreferences,
    paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod,
    inAppBalance, addToBalance, balanceTransactions,
  } = useAppStore();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { updateCurrentUser } = useAppStore();

  const handleAvatarUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Pick something under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        updateCurrentUser({ avatarUrl: e.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <button onClick={() => router.push('/')} className="-ml-2 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <BarryMark size={22} />
            <span className="font-display font-bold text-barry-blue">Barry</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-32">
        {/* Identity card with avatar upload */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Avatar user={currentUser} size={64} />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-barry-blue text-white flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all border-2 border-white"
              aria-label="Change avatar"
              title="Upload a profile picture"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={e => handleAvatarUpload(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg text-slate-900 truncate">
              {currentUser.firstName} {currentUser.lastName}
            </h1>
            <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block px-2 py-0.5 bg-blue-50 text-barry-blue text-[10px] font-bold uppercase tracking-wider rounded-full">
                Free plan
              </span>
              {currentUser.avatarUrl && (
                <button
                  onClick={() => updateCurrentUser({ avatarUrl: null })}
                  className="text-[10px] text-rose-600 font-semibold hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Balance card - prominent */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-emerald-500/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">In-app balance</p>
              <p className="font-display font-extrabold text-3xl tracking-tight mt-1">{inAppBalance.toFixed(2)} EUR</p>
              <p className="text-[11px] text-emerald-100 mt-1">Use for future trip expenses</p>
            </div>
            <button
              onClick={() => setShowTopUp(true)}
              className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 active:scale-95 transition-all"
            >
              Top up
            </button>
          </div>
          {balanceTransactions.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="mt-3 w-full text-[11px] font-medium text-emerald-100 hover:text-white py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              View {balanceTransactions.length} transaction{balanceTransactions.length === 1 ? '' : 's'}
            </button>
          )}
        </div>

        {/* SECTION: Preferences */}
        <SectionHeader title="Preferences" />
        <div className="bg-white rounded-2xl border border-slate-100 mb-4 divide-y divide-slate-100">
          <SettingRow
            label="Default transport"
            value={TRANSPORT_OPTIONS.find(o => o.value === preferences.defaultTransportMode)?.label || 'Public transit'}
            open={openSection === 'transport'}
            onToggle={() => setOpenSection(openSection === 'transport' ? null : 'transport')}
          >
            <div className="grid grid-cols-2 gap-1.5 pt-2">
              {TRANSPORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { updatePreferences({ defaultTransportMode: opt.value }); setOpenSection(null); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    preferences.defaultTransportMode === opt.value
                      ? 'bg-barry-blue text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow
            label="Language"
            value={LANGUAGE_OPTIONS.find(o => o.value === preferences.language)?.label || 'English'}
            open={openSection === 'language'}
            onToggle={() => setOpenSection(openSection === 'language' ? null : 'language')}
          >
            <div className="grid grid-cols-3 gap-1.5 pt-2">
              {LANGUAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { updatePreferences({ language: opt.value }); setOpenSection(null); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    preferences.language === opt.value
                      ? 'bg-barry-blue text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow
            label="Home address"
            value={preferences.homeLocation ? preferences.homeLabel : 'Not set'}
            open={openSection === 'home'}
            onToggle={() => setOpenSection(openSection === 'home' ? null : 'home')}
          >
            <div className="pt-2">
              <input
                type="text"
                value={preferences.homeLabel}
                onChange={e => updatePreferences({ homeLabel: e.target.value })}
                placeholder="Home, Office, Mom's place..."
                className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      pos => {
                        updatePreferences({ homeLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
                        setOpenSection(null);
                      },
                      () => alert('Location permission denied')
                    );
                  }
                }}
                className="w-full mt-2 py-2 rounded-xl bg-barry-blue text-white text-sm font-semibold active:scale-95 transition-all"
              >
                Use current location
              </button>
            </div>
          </SettingRow>

          <SettingRow
            label="Notifications"
            value={preferences.notifications ? 'On' : 'Off'}
          >
            <Toggle
              checked={preferences.notifications}
              onChange={(v) => updatePreferences({ notifications: v })}
            />
          </SettingRow>
        </div>

        {/* SECTION: Travel preferences (defaults reused on every Barry setup) */}
        <SectionHeader title="Travel preferences" />
        <p className="text-[11px] text-slate-500 -mt-1.5 mb-2 px-1">
          Saved here once, reused on every Barry. Saves typing.
        </p>
        <div className="bg-white rounded-2xl border border-slate-100 mb-4 divide-y divide-slate-100">
          <SettingRow
            label="Email for booking reports"
            value={preferences.defaultEmail || currentUser.email || 'Not set'}
            open={openSection === 'travel-email'}
            onToggle={() => setOpenSection(openSection === 'travel-email' ? null : 'travel-email')}
          >
            <input
              type="email"
              value={preferences.defaultEmail || ''}
              onChange={e => updatePreferences({ defaultEmail: e.target.value })}
              placeholder="you@example.com"
              className="w-full mt-2 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </SettingRow>

          <SettingRow
            label="Default max one-way duration"
            value={preferences.defaultMaxTime ? `${preferences.defaultMaxTime} ${preferences.defaultMaxTimeUnit || 'min'}` : 'Not set'}
            open={openSection === 'travel-time'}
            onToggle={() => setOpenSection(openSection === 'travel-time' ? null : 'travel-time')}
          >
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={preferences.defaultMaxTime || ''}
                onChange={e => updatePreferences({ defaultMaxTime: parseInt(e.target.value) || undefined })}
                placeholder="45"
                min={0}
                className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={preferences.defaultMaxTimeUnit || 'min'}
                onChange={e => updatePreferences({ defaultMaxTimeUnit: e.target.value as 'min' | 'h' })}
                className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="min">min</option>
                <option value="h">hours</option>
              </select>
            </div>
          </SettingRow>

          <SettingRow
            label="Total maximum budget"
            value={preferences.defaultMaxBudget ? `${preferences.defaultMaxBudget} ${preferences.defaultMaxBudgetCurrency || 'EUR'}` : 'Not set'}
            open={openSection === 'travel-budget'}
            onToggle={() => setOpenSection(openSection === 'travel-budget' ? null : 'travel-budget')}
          >
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={preferences.defaultMaxBudget || ''}
                onChange={e => updatePreferences({ defaultMaxBudget: parseInt(e.target.value) || undefined })}
                placeholder="100"
                min={0}
                className="flex-1 bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={preferences.defaultMaxBudgetCurrency || 'EUR'}
                onChange={e => updatePreferences({ defaultMaxBudgetCurrency: e.target.value as any })}
                className="bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
          </SettingRow>

          <SettingRow
            label="Self-book transport by default"
            value={preferences.defaultSelfBook ? 'On' : 'Off'}
          >
            <Toggle
              checked={preferences.defaultSelfBook || false}
              onChange={(v) => updatePreferences({ defaultSelfBook: v })}
            />
          </SettingRow>

          <SettingRow
            label="Loyalty / reduction cards"
            value={`${(preferences.defaultReductionCards || []).length} saved`}
            open={openSection === 'travel-cards'}
            onToggle={() => setOpenSection(openSection === 'travel-cards' ? null : 'travel-cards')}
          >
            <ReductionCardsManager
              cards={preferences.defaultReductionCards || []}
              onChange={(cards) => updatePreferences({ defaultReductionCards: cards })}
            />
          </SettingRow>
        </div>

        {/* SECTION: Payment methods */}
        <SectionHeader title="Payment methods" />
        <div className="bg-white rounded-2xl border border-slate-100 mb-4 overflow-hidden">
          {paymentMethods.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-slate-500 mb-3">No payment method yet</p>
              <button
                onClick={() => setShowAddCard(true)}
                className="px-4 py-2 rounded-xl bg-barry-blue text-white text-sm font-semibold active:scale-95 transition-all"
              >
                Add a card
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-7 rounded bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {pm.brand?.toUpperCase().slice(0, 4) || pm.type.toUpperCase().slice(0, 4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{pm.label}</p>
                      <p className="text-[11px] text-slate-500">
                        {pm.last4 ? `Ends in ${pm.last4}` : pm.type}
                      </p>
                    </div>
                    {pm.isDefault ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Default</span>
                    ) : (
                      <button
                        onClick={() => setDefaultPaymentMethod(pm.id)}
                        className="text-xs text-barry-blue font-medium"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Remove this payment method?')) removePaymentMethod(pm.id); }}
                      className="w-7 h-7 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
                      aria-label="Remove"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full px-4 py-3 text-sm font-semibold text-barry-blue hover:bg-slate-50 transition-colors border-t border-slate-100"
              >
                + Add another method
              </button>
            </>
          )}
        </div>

        {/* SECTION: Pro promo */}
        <SectionHeader title="Upgrade" />
        <div className="bg-gradient-to-br from-barry-blue to-blue-700 rounded-2xl p-4 text-white mb-4 shadow-lg shadow-blue-500/15">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">Coming soon</span>
          </div>
          <p className="font-display font-extrabold text-xl tracking-tight">Barry Pro</p>
          <p className="text-xs text-blue-100 leading-snug mt-1">
            Unlimited groups, premium booking integrations, group expense tracking. EUR 4.99 / month.
          </p>
        </div>

        {/* SECTION: Legal & About */}
        <SectionHeader title="Legal" />
        <div className="bg-white rounded-2xl border border-slate-100 mb-4 divide-y divide-slate-100">
          <LinkRow href="/legal/terms" label="Terms and conditions" />
          <LinkRow href="/legal/privacy" label="Privacy policy" />
          <LinkRow href="/legal/cookies" label="Cookie policy" />
        </div>

        {/* SECTION: About */}
        <SectionHeader title="About" />
        <div className="bg-white rounded-2xl border border-slate-100 mb-4 divide-y divide-slate-100">
          <LinkRow href="mailto:hello@barry.app" label="Contact support" />
          <LinkRow href="https://barry.app" label="barry.app" external />
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          Barry v0.1 · Prototype · Made in Paris
        </p>

        {/* Dev tools */}
        <div className="mt-4">
          <details className="bg-slate-50 rounded-xl">
            <summary className="px-3 py-2 text-[11px] font-semibold text-slate-500 cursor-pointer hover:text-slate-700">
              Developer options
            </summary>
            <div className="p-3 space-y-2">
              <button
                onClick={() => {
                  if (confirm('Reset all balance and payment data? This will reload the page.')) {
                    if (typeof window !== 'undefined') {
                      window.localStorage.removeItem('barry-app-state');
                      window.location.reload();
                    }
                  }
                }}
                className="w-full text-xs font-medium text-rose-600 py-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Reset balance + payment data
              </button>
              <p className="text-[10px] text-slate-400 leading-snug px-1">
                Clears persisted data only. Trip data resets on every reload anyway.
              </p>
            </div>
          </details>
        </div>
      </main>

      {showAddCard && (
        <AddCardSheet
          onClose={() => setShowAddCard(false)}
          onAdd={(pm) => { addPaymentMethod(pm); setShowAddCard(false); }}
        />
      )}

      {showTopUp && (
        <TopUpSheet
          hasPaymentMethod={paymentMethods.length > 0}
          onClose={() => setShowTopUp(false)}
          onTopUp={(amount) => { addToBalance(amount); setShowTopUp(false); }}
          onAddCard={() => { setShowTopUp(false); setShowAddCard(true); }}
        />
      )}

      {showHistory && (
        <BalanceHistorySheet
          transactions={balanceTransactions}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1 mt-4">
      {title}
    </h2>
  );
}

function SettingRow({ label, value, open, onToggle, children }: {
  label: string;
  value: string;
  open?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}) {
  const expandable = !!onToggle;

  // Non-expandable: render as div so children (which may be a <button>) don't nest
  if (!expandable) {
    return (
      <div className="w-full px-4 py-3 flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{value}</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{value}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-3">{children}</div>
      )}
    </div>
  );
}

function LinkRow({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
    >
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
        {external
          ? <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </a>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${checked ? 'bg-barry-blue' : 'bg-slate-200'}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function AddCardSheet({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (pm: { type: 'card'; last4: string; brand: string; label: string; isDefault: boolean }) => void;
}) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');

  const last4 = number.replace(/\s/g, '').slice(-4);
  const canSubmit = last4.length === 4 && name.trim().length > 0 && exp.length >= 5 && cvc.length >= 3;

  const detectBrand = (n: string): string => {
    const cleaned = n.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'Amex';
    return 'Card';
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900">Add a card</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Card number</label>
            <input
              type="text"
              value={number}
              onChange={e => setNumber(e.target.value.replace(/[^\d ]/g, '').slice(0, 19))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cardholder name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expiry</label>
              <input
                type="text"
                value={exp}
                onChange={e => {
                  let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                  setExp(v);
                }}
                placeholder="MM/YY"
                inputMode="numeric"
                className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={e => setCvc(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                placeholder="123"
                inputMode="numeric"
                className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 leading-snug">
            Demo mode: no real charge. In production this would use Stripe Connect with PCI-compliant tokenization.
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
          <button
            disabled={!canSubmit}
            onClick={() => onAdd({
              type: 'card',
              last4,
              brand: detectBrand(number),
              label: `${detectBrand(number)} ending in ${last4}`,
              isDefault: false,
            })}
            className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Save card
          </button>
        </div>
      </div>
    </div>
  );
}

function TopUpSheet({ hasPaymentMethod, onClose, onTopUp, onAddCard }: {
  hasPaymentMethod: boolean;
  onClose: () => void;
  onTopUp: (amount: number) => void;
  onAddCard: () => void;
}) {
  const [amount, setAmount] = useState(20);
  const PRESETS = [10, 20, 50, 100];

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900">Top up balance</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!hasPaymentMethod ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-3">You need a payment method first.</p>
              <button onClick={onAddCard} className="px-4 py-2 rounded-xl bg-barry-blue text-white text-sm font-semibold">
                Add a card
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      amount === p ? 'bg-barry-blue text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p} EUR
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Custom amount</label>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value) || 0)}
                    className="flex-1 bg-transparent text-3xl font-display font-extrabold text-slate-900 focus:outline-none"
                  />
                  <span className="text-lg font-bold text-slate-400">EUR</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Demo mode: no real charge.
              </p>
              <button
                disabled={amount <= 0}
                onClick={() => onTopUp(amount)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                Add {amount.toFixed(2)} EUR
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BalanceHistorySheet({ transactions, onClose }: {
  transactions: any[];
  onClose: () => void;
}) {
  const TYPE_COLOR: Record<string, string> = {
    topup: '#10B981',
    spend: '#EF4444',
    refund: '#3B82F6',
    reimbursement: '#10B981',
  };
  const TYPE_LABEL: Record<string, string> = {
    topup: 'Top-up',
    spend: 'Spent',
    refund: 'Refund',
    reimbursement: 'Reimbursement',
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900">Balance history</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const color = TYPE_COLOR[tx.type] || '#64748B';
                const label = TYPE_LABEL[tx.type] || tx.type;
                const isCredit = tx.type === 'topup' || tx.type === 'refund' || tx.type === 'reimbursement';
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
                        {isCredit
                          ? <path d="M12 5v14M5 12l7 7 7-7" transform="rotate(180 12 12)" />
                          : <path d="M12 5v14M5 12l7 7 7-7" />}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{tx.description}</p>
                      <p className="text-[11px] text-slate-500">
                        {label} · {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {isCredit ? '+' : ''}{Math.abs(tx.amount).toFixed(2)} EUR
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REDUCTION CARDS MANAGER (re-used for default loyalty cards)
// ============================================================
function ReductionCardsManager({
  cards, onChange,
}: { cards: ReductionCard[]; onChange: (cards: ReductionCard[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState('');
  const [number, setNumber] = useState('');

  const handleAdd = () => {
    if (!provider) return;
    const p = CARD_PROVIDERS.find(x => x.id === provider);
    if (!p) return;
    onChange([
      ...cards,
      {
        id: `rc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        provider,
        label: p.label,
        cardNumber: number,
        reductionPct: p.defaultReduction || 0,
      },
    ]);
    setProvider('');
    setNumber('');
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    onChange(cards.filter(c => c.id !== id));
  };

  return (
    <div className="pt-2 space-y-2">
      {cards.length > 0 && (
        <div className="space-y-1.5">
          {cards.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{c.label}</p>
                <p className="text-[10px] text-slate-600 truncate">
                  {c.cardNumber || 'No number'}
                  {c.reductionPct ? ` · -${c.reductionPct}%` : ''}
                </p>
              </div>
              <button
                onClick={() => handleRemove(c.id)}
                className="w-7 h-7 rounded-full hover:bg-rose-100 flex items-center justify-center text-rose-600"
                aria-label="Remove"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="bg-slate-50 rounded-xl p-3 space-y-2">
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Pick a card provider...</option>
            <optgroup label="Rail (France)">
              {CARD_PROVIDERS.filter(p => p.type === 'rail' && p.countries?.includes('FR')).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="Rail (Other Europe)">
              {CARD_PROVIDERS.filter(p => p.type === 'rail' && !p.countries?.includes('FR')).map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="Airlines">
              {CARD_PROVIDERS.filter(p => p.type === 'air').map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="Bus">
              {CARD_PROVIDERS.filter(p => p.type === 'bus').map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
          </select>
          <input
            type="text"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="Card / member number"
            className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!provider}
              className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 active:scale-95 transition-all"
            >
              Add card
            </button>
            <button
              onClick={() => { setShowAdd(false); setProvider(''); setNumber(''); }}
              className="px-3 py-2 text-slate-600 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-semibold transition-colors"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}
