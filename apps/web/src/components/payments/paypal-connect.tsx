'use client';

import React, { useState } from 'react';

/**
 * PayPal "Connect" flow.
 *
 * Production flow (when NEXT_PUBLIC_PAYPAL_CLIENT_ID is configured):
 *
 *   1. User clicks 'Connect PayPal'
 *   2. Browser opens https://www.paypal.com/connect?client_id=...&response_type=code...
 *   3. PayPal redirects back to /api/v1/payments/paypal/callback?code=...
 *   4. Backend exchanges code for tokens, links to user
 *   5. We redirect to /profile?paypal=connected
 *
 * Demo mode (no client id): clear notice + no destructive action.
 *
 * This is a SIMPLER alternative to embedding the PayPal Checkout SDK. We're
 * just establishing a billing agreement we can charge later, not running a
 * one-time checkout.
 */

export interface PayPalPaymentMethod {
  type: 'paypal';
  last4: '';
  brand: 'PayPal';
  label: string;
  isDefault: boolean;
  paypalBillingAgreementId?: string;
}

interface PayPalConnectProps {
  /** Called after a successful PayPal connection in demo mode for testing */
  onAdd: (pm: PayPalPaymentMethod) => void;
  /** User's email (for the label) */
  userEmail?: string;
}

export function PayPalConnect({ onAdd, userEmail }: PayPalConnectProps) {
  const [busy, setBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const handleConnect = () => {
    setBusy(true);

    if (!clientId) {
      // Demo fallback - simulate a successful linkage so the user can keep
      // exploring. Real production WILL NOT take this path.
      setTimeout(() => {
        onAdd({
          type: 'paypal',
          last4: '',
          brand: 'PayPal',
          label: userEmail || 'PayPal account',
          isDefault: false,
        });
        setBusy(false);
      }, 500);
      return;
    }

    // Production: redirect to PayPal Connect
    const returnUrl = encodeURIComponent(`${window.location.origin}/api/v1/payments/paypal/callback`);
    const state = encodeURIComponent(Math.random().toString(36).slice(2));
    const scope = encodeURIComponent('openid profile email');
    window.location.href =
      `https://www.paypal.com/connect?flowEntry=static`
      + `&client_id=${encodeURIComponent(clientId)}`
      + `&response_type=code`
      + `&scope=${scope}`
      + `&redirect_uri=${returnUrl}`
      + `&state=${state}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#003087]/5 border border-[#003087]/20">
        <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center flex-shrink-0 text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 1.51A.641.641 0 015.572.97H13.4c2.625 0 4.45.546 5.273 1.62.748.973 1.005 2.412.764 4.273-.013.094-.027.19-.04.29-.014.092-.029.183-.045.273-.79 4.069-3.531 5.475-7.011 5.475H10.66c-.534 0-.985.388-1.067.916l-.738 4.683-.32 2.04a.327.327 0 01-.323.262z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Pay with PayPal</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
            You&rsquo;ll be redirected to PayPal to log in and authorize Barry to charge your account.
            No card number stored.
          </p>
        </div>
      </div>

      {!clientId && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
          <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug">
            <span className="font-bold">Demo mode:</span> PayPal isn&rsquo;t wired to a live merchant
            account yet. Click below to simulate a successful connection.
          </p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={busy}
        className="w-full bg-[#003087] hover:bg-[#001f5c] text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 1.51A.641.641 0 015.572.97H13.4c2.625 0 4.45.546 5.273 1.62.748.973 1.005 2.412.764 4.273-.013.094-.027.19-.04.29-.014.092-.029.183-.045.273-.79 4.069-3.531 5.475-7.011 5.475H10.66c-.534 0-.985.388-1.067.916l-.738 4.683-.32 2.04a.327.327 0 01-.323.262z" />
        </svg>
        {busy ? 'Connecting...' : (clientId ? 'Continue with PayPal' : 'Simulate connect (demo)')}
      </button>
    </div>
  );
}
