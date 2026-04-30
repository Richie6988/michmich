'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

const MOCK_TEST_USERS = [
  { email: 'chloe@example.com', firstName: 'Chloé', lastName: 'Dubois' },
  { email: 'tom@example.com', firstName: 'Tom', lastName: 'Petit' },
  { email: 'marc@example.com', firstName: 'Marc', lastName: 'Laurent' },
];

type TabMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { login, signup } = useAppStore();

  const [mode, setMode] = useState<TabMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const canSubmit = (() => {
    if (mode === 'login') return email.includes('@') && password.length >= 4;
    if (mode === 'signup') return email.includes('@') && password.length >= 6 && firstName.length >= 2;
    if (mode === 'forgot') return email.includes('@');
    return false;
  })();

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === 'login') {
      login(email);
      router.push(redirect as any);
    } else if (mode === 'signup') {
      signup(firstName, lastName, email);
      router.push(redirect as any);
    } else if (mode === 'forgot') {
      // Mock: pretend to send
      setForgotSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <BarryMark size={28} />
          <span className="font-display font-extrabold text-xl text-barry-blue">Barry</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <BarryMascot mood="happy" size={88} />
            <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-slate-100 mt-3 tracking-tight">
              {mode === 'login' && 'Welcome back.'}
              {mode === 'signup' && 'Hey there.'}
              {mode === 'forgot' && 'Forgot your password?'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login' && 'Pick up where you left off.'}
              {mode === 'signup' && "Let's set up your account."}
              {mode === 'forgot' && "We'll email you a reset link."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5">
            <button
              onClick={() => { setMode('login'); setForgotSent(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode('signup'); setForgotSent(false); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
            {forgotSent && mode === 'forgot' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Check your email</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  If an account exists for {email}, we've sent a reset link.
                </p>
                <button
                  onClick={() => { setMode('login'); setForgotSent(false); }}
                  className="mt-4 text-sm text-barry-blue font-semibold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">First name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Marie"
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Last name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Dupont"
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                      {mode === 'login' && (
                        <button
                          onClick={() => setMode('forgot')}
                          className="text-[11px] text-barry-blue font-semibold hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                      className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {mode === 'login' && 'Sign in'}
                  {mode === 'signup' && 'Create my account'}
                  {mode === 'forgot' && 'Send reset link'}
                </button>

                {mode === 'forgot' && (
                  <button
                    onClick={() => setMode('login')}
                    className="w-full text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:text-slate-300"
                  >
                    Back to sign in
                  </button>
                )}

                {/* Demo users for quick login (mock data) */}
                {mode === 'login' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Or sign in as a demo user</p>
                    <div className="space-y-1">
                      {MOCK_TEST_USERS.map(u => (
                        <button
                          key={u.email}
                          onClick={() => { login(u.email); router.push(redirect as any); }}
                          className="w-full text-left text-xs bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 transition-colors"
                        >
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{u.firstName} {u.lastName}</span>
                          <span className="text-slate-500 dark:text-slate-400"> · {u.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-4">
            By continuing you agree to Barry's <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
