'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useDialog } from '@/components/ui/dialog';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

// Demo users for quick sign-in (still works with any password >= 6 chars)
const DEMO_USERS = [
  { email: 'chloe@example.com', firstName: 'Chloé', lastName: 'Dubois' },
  { email: 'tom@example.com', firstName: 'Tom', lastName: 'Petit' },
  { email: 'marc@example.com', firstName: 'Marc', lastName: 'Laurent' },
];

const MOCK_EMAILS = DEMO_USERS.map(u => u.email);

type TabMode = 'login' | 'signup' | 'forgot' | 'verify';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  bg: string;
}

function evaluatePassword(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, PasswordStrength> = {
    0: { score: 0, label: 'Too short', color: 'text-rose-600', bg: 'bg-rose-500' },
    1: { score: 1, label: 'Weak', color: 'text-rose-600', bg: 'bg-rose-500' },
    2: { score: 2, label: 'Fair', color: 'text-amber-700', bg: 'bg-amber-500' },
    3: { score: 3, label: 'Good', color: 'text-blue-700', bg: 'bg-blue-500' },
    4: { score: 4, label: 'Strong', color: 'text-emerald-700', bg: 'bg-emerald-500' },
  };
  return map[Math.min(score, 4) as 0 | 1 | 2 | 3 | 4];
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const { login, signup, verifyPassword, sendPasswordReset } = useAppStore();
  const { alert: showAlert } = useDialog();

  const [mode, setMode] = useState<TabMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifyCode, setVerifyCode] = useState('');

  const emailValid = EMAIL_REGEX.test(email);
  const pwStrength = useMemo(() => evaluatePassword(password), [password]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode !== 'forgot' && mode !== 'verify') {
      if (!email) e.email = 'Email is required';
      else if (!emailValid) e.email = 'Please enter a valid email';
    }
    if (mode === 'login' || mode === 'signup') {
      if (!password) e.password = 'Password is required';
      else if (mode === 'signup' && pwStrength.score < 2) e.password = 'Password is too weak. Add length, mix case, or numbers.';
      else if (mode === 'login' && password.length < 6) e.password = 'Passwords are at least 6 characters';
    }
    if (mode === 'signup') {
      if (!firstName.trim()) e.firstName = 'First name is required';
      else if (firstName.trim().length < 2) e.firstName = 'Use your real first name';
      if (lastName.trim() && lastName.trim().length < 2) e.lastName = 'Use your real last name';
    }
    if (mode === 'forgot') {
      if (!email) e.email = 'Email is required';
      else if (!emailValid) e.email = 'Please enter a valid email';
    }
    if (mode === 'verify') {
      if (!verifyCode || verifyCode.length !== 6) e.verifyCode = 'Code is 6 digits';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = (() => {
    if (submitting) return false;
    if (mode === 'login') return emailValid && password.length >= 6;
    if (mode === 'signup') return emailValid && pwStrength.score >= 2 && firstName.trim().length >= 2;
    if (mode === 'forgot') return emailValid;
    if (mode === 'verify') return verifyCode.length === 6;
    return false;
  })();

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (mode === 'login') {
        // Verify credentials against backend (falls back to demo for mock accounts)
        const ok = await verifyPassword(email, password);
        if (!ok) {
          setErrors({ password: 'Wrong email or password.' });
          setSubmitting(false);
          return;
        }
        // login() is a no-op for backend-authed users (verifyPassword already set
        // currentUser); only used as fallback when verifyPassword returned true via demo path
        if (MOCK_EMAILS.includes(email)) login(email);
        router.push(redirect as any);
      } else if (mode === 'signup') {
        // signup wires backend; on success, currentUser is set automatically
        await signup(firstName.trim(), lastName.trim(), email, password);
        setMode('verify');
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setForgotSent(true);
      } else if (mode === 'verify') {
        // Any 6-digit code works in dev. In prod this would call POST /auth/verify-email
        await showAlert({
          title: 'Email verified!',
          body: 'Welcome aboard. Let&rsquo;s plan your first Barry.',
          variant: 'success',
        });
        router.push(redirect as any);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    // In production this redirects to /api/v1/auth/google or /auth/apple OAuth flow.
    // For now we show a heads-up dialog.
    await showAlert({
      title: `${provider === 'google' ? 'Google' : 'Apple'} sign-in`,
      body: 'OAuth flows are coming soon. For now, sign in with email or use a demo account below.',
      variant: 'info',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <BarryMark size={28} />
          <span className="font-display font-extrabold text-xl text-barry-blue">Barry</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block barry-mascot-idle">
              <BarryMascot mood={mode === 'verify' ? 'celebrating' : 'happy'} size={88} />
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 mt-3 tracking-tight">
              {mode === 'login' && 'Welcome back.'}
              {mode === 'signup' && 'Hey there.'}
              {mode === 'forgot' && 'Forgot your password?'}
              {mode === 'verify' && 'Check your email.'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'login' && 'Pick up where you left off.'}
              {mode === 'signup' && "Let's set up your account."}
              {mode === 'forgot' && "We'll email you a reset link."}
              {mode === 'verify' && `We sent a 6-digit code to ${email}.`}
            </p>
          </div>

          {/* Tabs (login/signup) — hidden on forgot/verify */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5">
              <button
                onClick={() => { setMode('login'); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => { setMode('signup'); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'signup' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {/* OAuth buttons (login + signup only) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-2 mb-3">
              <button
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.98 10.98 0 001 12c0 1.78.43 3.46 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Continue with Google</span>
              </button>
              <button
                onClick={() => handleOAuth('apple')}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.99] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span className="text-sm font-semibold">Continue with Apple</span>
              </button>
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or with email</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-3">
            {/* FORGOT - sent state */}
            {forgotSent && mode === 'forgot' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Check your email</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  If an account exists for {email}, we&rsquo;ve sent a reset link.
                </p>
                <button
                  onClick={() => { setMode('login'); setForgotSent(false); }}
                  className="mt-4 text-sm text-barry-blue font-semibold hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            ) : mode === 'verify' ? (
              /* VERIFY EMAIL STEP */
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Verification code</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className={`w-full bg-white dark:bg-slate-800 border text-center tracking-[0.5em] text-lg font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.verifyCode ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                  />
                  {errors.verifyCode && <p className="text-xs text-rose-600 mt-1">{errors.verifyCode}</p>}
                  <p className="text-[10px] text-slate-400 mt-2">Tip: in dev mode, any 6-digit code works.</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {submitting ? 'Verifying...' : 'Verify email'}
                </button>
                <button
                  onClick={() => { setMode('signup'); setVerifyCode(''); setErrors({}); }}
                  className="w-full text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Use a different email
                </button>
              </>
            ) : (
              /* LOGIN / SIGNUP / FORGOT FORMS */
              <>
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">First name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => { setFirstName(e.target.value); if (errors.firstName) setErrors(p => ({ ...p, firstName: '' })); }}
                        placeholder="Marie"
                        autoComplete="given-name"
                        className={`w-full bg-white dark:bg-slate-800 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                          errors.firstName ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {errors.firstName && <p className="text-[10px] text-rose-600 mt-0.5">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Last name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Dupont"
                        autoComplete="family-name"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    inputMode="email"
                    className={`w-full bg-white dark:bg-slate-800 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      errors.email ? 'border-rose-300' : email && emailValid ? 'border-emerald-300' : 'border-slate-200 dark:border-slate-700'
                    }`}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                  {errors.email ? (
                    <p className="text-[10px] text-rose-600 mt-0.5">{errors.email}</p>
                  ) : email && !emailValid ? (
                    <p className="text-[10px] text-amber-600 mt-0.5">Hmm, that email doesn&rsquo;t look right.</p>
                  ) : null}
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                      {mode === 'login' && (
                        <button
                          onClick={() => { setMode('forgot'); setErrors({}); }}
                          className="text-[11px] text-barry-blue font-semibold hover:underline"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: '' })); }}
                        placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        className={`w-full bg-white dark:bg-slate-800 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                          errors.password ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-600 mt-0.5">{errors.password}</p>}

                    {/* Strength meter — signup only */}
                    {mode === 'signup' && password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`flex-1 h-1 rounded-full transition-colors ${
                                i < pwStrength.score ? pwStrength.bg : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-semibold ${pwStrength.color}`}>
                          {pwStrength.label}
                          <span className="text-slate-400 font-normal ml-1.5">
                            {pwStrength.score < 3 && 'Try mixing case, numbers, and symbols.'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M12 2a10 10 0 0110 10" /></svg>
                      Working...
                    </span>
                  ) : (
                    <>
                      {mode === 'login' && 'Sign in'}
                      {mode === 'signup' && 'Create my account'}
                      {mode === 'forgot' && 'Send reset link'}
                    </>
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    onClick={() => { setMode('login'); setErrors({}); }}
                    className="w-full text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Back to sign in
                  </button>
                )}

                {/* Demo users for quick login */}
                {mode === 'login' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Or try a demo account</p>
                    <div className="space-y-1">
                      {DEMO_USERS.map(u => (
                        <button
                          key={u.email}
                          onClick={() => { login(u.email); router.push(redirect as any); }}
                          className="w-full text-left text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
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
            By continuing you agree to Barry&rsquo;s <Link href="/legal" className="underline">Terms & privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
