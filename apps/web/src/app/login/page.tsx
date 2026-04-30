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

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { login, signup } = useAppStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const canLogin = mode === 'login' ? email.includes('@') : (email.includes('@') && firstName.length >= 2);

  const handleSubmit = () => {
    if (!canLogin) return;
    if (mode === 'login') {
      login(email);
    } else {
      signup(firstName, lastName, email);
    }
    router.push(redirect as any);
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
            <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-3 tracking-tight">
              {mode === 'login' ? 'Welcome back.' : 'Hey there.'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login' ? 'Pick up where you left off.' : 'Let\'s set up your account.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Marie"
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canLogin}
              className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {mode === 'login' ? 'Sign in' : 'Create my account'}
            </button>

            {/* Demo users for quick login (mock data) */}
            {mode === 'login' && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Or sign in as a demo user</p>
                <div className="space-y-1">
                  {MOCK_TEST_USERS.map(u => (
                    <button
                      key={u.email}
                      onClick={() => { login(u.email); router.push(redirect as any); }}
                      className="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                    >
                      <span className="font-semibold text-slate-900">{u.firstName} {u.lastName}</span>
                      <span className="text-slate-500"> · {u.email}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-4">
            By signing in you agree to Barry's <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
