'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useDialog } from '@/components/ui/dialog';
import { geocode, type NominatimResult } from '@/lib/api/nominatim';
import type { GeoPoint } from '@barry/shared-types';
import { BarryMark } from '@/components/barry/brand';
import { Avatar } from '@/components/ui/avatar';
import { TRANSPORT_OPTIONS } from '@/lib/transport/transport-modes';
import { StripeAddCard } from '@/components/payments/stripe-add-card';
import { PayPalConnect } from '@/components/payments/paypal-connect';
import { CARD_PROVIDERS } from '@/lib/data/reduction-cards';
import type { ReductionCard } from '@barry/shared-types';

const LANGUAGE_OPTIONS = [
  { value: 'en' as const, label: 'English', supported: true },
  { value: 'fr' as const, label: 'Francais', supported: true },
  { value: 'es' as const, label: 'Espanol', supported: false },
  { value: 'de' as const, label: 'Deutsch', supported: false },
  { value: 'it' as const, label: 'Italiano', supported: false },
  { value: 'pt' as const, label: 'Portugues', supported: false },
  { value: 'nl' as const, label: 'Nederlands', supported: false },
  { value: 'pl' as const, label: 'Polski', supported: false },
  { value: 'ro' as const, label: 'Romana', supported: false },
  { value: 'sv' as const, label: 'Svenska', supported: false },
  { value: 'da' as const, label: 'Dansk', supported: false },
  { value: 'no' as const, label: 'Norsk', supported: false },
  { value: 'fi' as const, label: 'Suomi', supported: false },
  { value: 'cs' as const, label: 'Cestina', supported: false },
  { value: 'el' as const, label: 'Ellinika', supported: false },
  { value: 'tr' as const, label: 'Turkce', supported: false },
  { value: 'ru' as const, label: 'Russkiy', supported: false },
  { value: 'ja' as const, label: 'Nihongo', supported: false },
  { value: 'zh' as const, label: 'Zhongwen', supported: false },
  { value: 'ar' as const, label: 'al-Arabiyya', supported: false },
] as const;

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
  const { alert: showAlert, confirm: showConfirm } = useDialog();

  const handleAvatarUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert({ title: 'Wrong file type', body: 'Please choose an image file.', variant: 'warning' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert({ title: 'Too big', body: 'Image too large. Pick something under 5 MB.', variant: 'warning' });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <button onClick={() => router.push('/')} className="-ml-2 p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 mb-3 flex items-center gap-3">
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
            <h1 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
              {currentUser.firstName} {currentUser.lastName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
            {currentUser.avatarUrl && (
              <button
                onClick={() => updateCurrentUser({ avatarUrl: null })}
                className="mt-1 text-[10px] text-rose-600 font-semibold hover:underline"
              >
                Remove photo
              </button>
            )}
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
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white dark:bg-slate-900/30 active:scale-95 transition-all"
            >
              Top up
            </button>
          </div>
          {balanceTransactions.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="mt-3 w-full text-[11px] font-medium text-emerald-100 hover:text-white py-1.5 rounded-lg bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 transition-all"
            >
              View {balanceTransactions.length} transaction{balanceTransactions.length === 1 ? '' : 's'}
            </button>
          )}
        </div>

        {/* SECTION: Preferences */}
        <SectionHeader title="Preferences" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 divide-y divide-slate-100">
          <SettingRow
            label="Default transport"
            value={TRANSPORT_OPTIONS.find(o => o.value === preferences.defaultTransportMode)?.label || 'Public transit'}
            open={openSection === 'transport'}
            onToggle={() => setOpenSection(openSection === 'transport' ? null : 'transport')}
          >
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2">
              {TRANSPORT_OPTIONS.map(opt => {
                const selected = preferences.defaultTransportMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { updatePreferences({ defaultTransportMode: opt.value }); setOpenSection(null); }}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all border ${
                      selected
                        ? 'border-barry-blue bg-blue-50 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <svg
                      width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke={selected ? opt.color : '#94A3B8'}
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    >
                      {opt.icon}
                    </svg>
                    <span className={selected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
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
                  className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    preferences.language === opt.value
                      ? 'bg-barry-blue text-white'
                      : opt.supported
                        ? 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:bg-slate-800'
                  }`}
                  title={opt.supported ? 'Full translation available' : 'Coming soon - shows English for now'}
                >
                  {opt.label}
                  {opt.supported && preferences.language !== opt.value && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" aria-label="Available" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-snug">
              Green dot = full translation available. Other languages will show English until we ship more catalogs.
            </p>
          </SettingRow>

          <SettingRow
            label="Home address"
            value={preferences.homeLocation ? preferences.homeLabel : 'Not set'}
            open={openSection === 'home'}
            onToggle={() => setOpenSection(openSection === 'home' ? null : 'home')}
          >
            <HomeAddressEditor
              currentLabel={preferences.homeLabel}
              currentLocation={preferences.homeLocation}
              onSave={(label, loc) => {
                updatePreferences({ homeLabel: label, homeLocation: loc });
                setOpenSection(null);
              }}
              onLocationDenied={() => showAlert({ title: 'Location denied', body: 'Allow location access in your browser to autofill your home address.', variant: 'warning' })}
            />
          </SettingRow>

          <NotificationsRow
            checked={preferences.notifications}
            onChange={(v) => updatePreferences({ notifications: v })}
          />

          <SettingRow
            label="Appearance"
            value={
              preferences.theme === 'dark' ? 'Dark' :
              preferences.theme === 'light' ? 'Light' :
              'Auto (follow system)'
            }
            open={openSection === 'theme'}
            onToggle={() => setOpenSection(openSection === 'theme' ? null : 'theme')}
          >
            <div className="grid grid-cols-3 gap-1.5 pt-2">
              {[
                { value: 'light', label: 'Light' },
                { value: 'auto', label: 'Auto' },
                { value: 'dark', label: 'Dark' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { updatePreferences({ theme: opt.value as any }); setOpenSection(null); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    (preferences.theme || 'auto') === opt.value
                      ? 'bg-barry-blue text-white'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-snug">
              Auto follows your operating system's appearance setting.
            </p>
          </SettingRow>
        </div>

        {/* SECTION: Travel preferences (defaults reused on every Barry setup) */}
        <SectionHeader title="Travel preferences" />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-1.5 mb-2 px-1">
          Saved here once, reused on every Barry. Saves typing.
        </p>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 divide-y divide-slate-100">
          <SettingRow
            label="Email for booking reports"
            value={currentUser.email || 'Not set'}
          >
            <div className="mt-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{currentUser.email}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                We use your account email. Change it from Account &gt; Email above.
              </p>
            </div>
          </SettingRow>

          {/* req 12: Default duration + budget removed - they're per-trip choices, not profile defaults */}

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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 overflow-hidden">
          {paymentMethods.length === 0 ? (
            <div className="px-4 py-5 text-center space-y-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No payment method yet</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAddCard(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-barry-blue text-white text-sm font-semibold active:scale-95 transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                  Add a card
                </button>
                <button
                  onClick={() => addPaymentMethod({ type: 'paypal', last4: '', brand: 'PayPal', label: currentUser?.email || 'PayPal account', isDefault: paymentMethods.length === 0 })}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#003087] text-white text-sm font-semibold active:scale-95 transition-all hover:bg-[#001f5c]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 1.51A.641.641 0 015.572.97H13.4c2.625 0 4.45.546 5.273 1.62.748.973 1.005 2.412.764 4.273-.013.094-.027.19-.04.29-.014.092-.029.183-.045.273-.79 4.069-3.531 5.475-7.011 5.475H10.66c-.534 0-.985.388-1.067.916l-.738 4.683-.32 2.04a.327.327 0 01-.323.262z" /></svg>
                  Use PayPal
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paymentMethods.map(pm => (
                  <div key={pm.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-7 rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                      pm.type === 'paypal' ? 'bg-[#003087]' : 'bg-gradient-to-br from-slate-700 to-slate-900'
                    }`}>
                      {pm.type === 'paypal' ? 'PP' : (pm.brand?.toUpperCase().slice(0, 4) || pm.type.toUpperCase().slice(0, 4))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{pm.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pm.type === 'paypal' ? 'PayPal' : pm.last4 ? `Ends in ${pm.last4}` : pm.type}
                      </p>
                    </div>
                    {pm.isDefault ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Default</span>
                    ) : (
                      <button
                        onClick={() => setDefaultPaymentMethod(pm.id)}
                        className="text-xs text-barry-blue font-medium"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const ok = await showConfirm({
                          title: 'Remove payment method?',
                          body: 'You can add it back any time.',
                          variant: 'danger',
                          confirmLabel: 'Remove',
                        });
                        if (ok) removePaymentMethod(pm.id);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors"
                      aria-label="Remove"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowAddCard(true)}
                  className="px-4 py-3 text-sm font-semibold text-barry-blue hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Card
                </button>
                <button
                  onClick={() => addPaymentMethod({ type: 'paypal', last4: '', brand: 'PayPal', label: currentUser?.email || 'PayPal account', isDefault: false })}
                  className="px-4 py-3 text-sm font-semibold text-[#003087] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 border-l border-slate-100 dark:border-slate-800"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 1.51A.641.641 0 015.572.97H13.4c2.625 0 4.45.546 5.273 1.62.748.973 1.005 2.412.764 4.273-.013.094-.027.19-.04.29-.014.092-.029.183-.045.273-.79 4.069-3.531 5.475-7.011 5.475H10.66c-.534 0-.985.388-1.067.916l-.738 4.683-.32 2.04a.327.327 0 01-.323.262z" /></svg>
                  PayPal
                </button>
              </div>
            </>
          )}
        </div>

        {/* No subscription tiers. Barry is free. */}

        {/* SECTION: Legal & privacy (consolidated into one page in Wave 25) */}
        <SectionHeader title="Legal & privacy" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 divide-y divide-slate-100 dark:divide-slate-800">
          <LinkRow href="/legal" label="Terms, privacy, cookies & my data" />
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          Need help? Open any trip and tap the (?) icon to message us in context.
        </p>
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
    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1 mt-4">
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
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{value}</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:bg-slate-900 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{value}</p>
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
      className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:bg-slate-900 transition-colors"
    >
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
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
        className={`w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function AddCardSheet({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (pm: { type: 'card' | 'paypal'; last4: string; brand: string; label: string; isDefault: boolean; stripePaymentMethodId?: string; paypalBillingAgreementId?: string }) => void;
}) {
  const { currentUser } = useAppStore();
  const [tab, setTab] = useState<'card' | 'paypal'>('card');

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">Add a payment method</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pt-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setTab('card')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'card' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
              Card
            </button>
            <button
              onClick={() => setTab('paypal')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'paypal' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 1.51A.641.641 0 015.572.97H13.4c2.625 0 4.45.546 5.273 1.62.748.973 1.005 2.412.764 4.273-.013.094-.027.19-.04.29-.014.092-.029.183-.045.273-.79 4.069-3.531 5.475-7.011 5.475H10.66c-.534 0-.985.388-1.067.916l-.738 4.683-.32 2.04a.327.327 0 01-.323.262z" /></svg>
              PayPal
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'card' ? (
            <StripeAddCard
              onAdd={pm => onAdd(pm)}
            />
          ) : (
            <PayPalConnect
              userEmail={currentUser?.email}
              onAdd={pm => onAdd(pm)}
            />
          )}
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
      <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">Top up balance</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!hasPaymentMethod ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">You need a payment method first.</p>
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
                      amount === p ? 'bg-barry-blue text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {p} EUR
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Custom amount</label>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value) || 0)}
                    className="flex-1 bg-transparent text-3xl font-display font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <span className="text-lg font-bold text-slate-400">EUR</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
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
      <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100">Balance history</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {transactions.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => {
                const color = TYPE_COLOR[tx.type] || '#64748B';
                const label = TYPE_LABEL[tx.type] || tx.type;
                const isCredit = tx.type === 'topup' || tx.type === 'refund' || tx.type === 'reimbursement';
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
                        {isCredit
                          ? <path d="M12 5v14M5 12l7 7 7-7" transform="rotate(180 12 12)" />
                          : <path d="M12 5v14M5 12l7 7 7-7" />}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{tx.description}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{c.label}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
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
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 space-y-2">
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            className="w-full bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold transition-colors"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}

// ============================================================
// NOTIFICATIONS ROW (with browser permission flow)
// ============================================================
function NotificationsRow({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { preferences, updatePreferences } = useAppStore();
  const channel = preferences.notificationChannel || 'webapp';
  const [permission, setPermission] = React.useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as any);
  }, []);

  const handleAskPermission = async () => {
    const { requestPermission } = await import('@/lib/notifications/service');
    const result = await requestPermission();
    if (result === 'unsupported') {
      setPermission('unsupported');
      return;
    }
    setPermission(result as any);
    if (result === 'granted') onChange(true);
  };

  const valueLabel = !checked ? 'Off' : channel === 'email' ? 'On - email' : 'On - in app';

  return (
    <SettingRow
      label="Notifications"
      value={valueLabel}
      open={false}
    >
      <div className="space-y-3">
        {/* On/Off master toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Receive notifications</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Chat replies, vote results, booking updates.</p>
          </div>
          <Toggle checked={checked} onChange={onChange} />
        </div>

        {/* Channel selector - only shown when notifications are ON */}
        {checked && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Where</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updatePreferences({ notificationChannel: 'webapp' })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  channel === 'webapp'
                    ? 'border-barry-blue bg-blue-50 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={channel === 'webapp' ? '#2563EB' : '#94A3B8'} strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${channel === 'webapp' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>In webapp</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Browser push + in-app</p>
                </div>
              </button>
              <button
                onClick={() => updatePreferences({ notificationChannel: 'email' })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  channel === 'email'
                    ? 'border-barry-blue bg-blue-50 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={channel === 'email' ? '#2563EB' : '#94A3B8'} strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${channel === 'email' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>By email</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Daily digest</p>
                </div>
              </button>
            </div>

            {/* Browser permission helper - only relevant for webapp channel */}
            {channel === 'webapp' && permission === 'default' && (
              <button
                onClick={handleAskPermission}
                className="mt-2 w-full px-3 py-2 bg-barry-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                Allow browser notifications
              </button>
            )}
            {channel === 'webapp' && permission === 'denied' && (
              <p className="mt-2 text-[10px] text-rose-600 font-medium">Browser blocked - enable in site settings to receive push notifications</p>
            )}
            {channel === 'webapp' && permission === 'unsupported' && (
              <p className="mt-2 text-[10px] text-amber-600 font-medium">This browser doesn&rsquo;t support push - you&rsquo;ll still see in-app notifications</p>
            )}
          </div>
        )}
      </div>
    </SettingRow>
  );
}

/**
 * HomeAddressEditor - autocomplete address input via Nominatim.
 * Shows verified address on save (req 8).
 */
function HomeAddressEditor({
  currentLabel, currentLocation, onSave, onLocationDenied,
}: {
  currentLabel: string;
  currentLocation: GeoPoint | null;
  onSave: (label: string, loc: GeoPoint | null) => void;
  onLocationDenied: () => void;
}) {
  const [label, setLabel] = useState(currentLabel || '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [verified, setVerified] = useState(!!currentLocation);
  const [coords, setCoords] = useState<GeoPoint | null>(currentLocation);

  // Debounced geocode lookup
  useEffect(() => {
    if (!label || label.length < 3) { setResults([]); return; }
    if (label === currentLabel && verified) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await geocode(label, 5);
        setResults(found);
        setShowSuggestions(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [label, currentLabel, verified]);

  const handleSelect = (r: NominatimResult) => {
    setLabel(r.display_name);
    setCoords({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setVerified(true);
    setShowSuggestions(false);
    onSave(r.display_name, { lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
  };

  const handleCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(loc);
          setVerified(true);
          setLabel('My current location');
          onSave('My current location', loc);
        },
        () => onLocationDenied(),
      );
    }
  };

  return (
    <div className="pt-2">
      <div className="relative">
        <input
          type="text"
          value={label}
          onChange={e => { setLabel(e.target.value); setVerified(false); setCoords(null); }}
          onFocus={() => results.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Start typing your address..."
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {/* Verified badge */}
        {verified && coords && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center" title="Verified address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        )}
        {loading && !verified && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-300 border-t-barry-blue rounded-full animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && results.length > 0 && (
        <div className="mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
            >
              <p className="text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{r.display_name}</p>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleCurrentLocation}
        className="w-full mt-2 py-2 rounded-xl bg-barry-blue text-white text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" /></svg>
        Use current location
      </button>

      {!verified && label.length >= 3 && (
        <p className="text-[10px] text-amber-600 mt-1.5">Pick a suggestion above to verify your address.</p>
      )}
    </div>
  );
}
