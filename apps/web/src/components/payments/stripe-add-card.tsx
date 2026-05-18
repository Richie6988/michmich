'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Elements, CardElement, useStripe, useElements,
} from '@stripe/react-stripe-js';

/**
 * Stripe Elements integration for adding a card.
 *
 * Two modes:
 *
 * 1. PRODUCTION (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set):
 *    Real Stripe Elements iframe captures card data PCI-compliantly,
 *    creates a payment method, and returns its ID.
 *
 * 2. DEMO (no key configured):
 *    Falls back to a non-functional notice so the app doesn't crash, with
 *    a clear "demo mode" badge. Users can still see the flow.
 *
 * Backend needs an endpoint POST /api/v1/payments/setup-intent that returns
 * { clientSecret } from stripe.setupIntents.create. We call this on mount.
 */

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export interface CardPaymentMethod {
  type: 'card';
  last4: string;
  brand: string;
  label: string;
  isDefault: boolean;
  /** Stripe payment method id (pm_...). Null in demo mode. */
  stripePaymentMethodId?: string;
}

interface StripeCardFormProps {
  onAdd: (pm: CardPaymentMethod) => void;
  onError?: (msg: string) => void;
}

/** Inner form that actually uses Stripe hooks - must be inside <Elements> */
function StripeCardForm({ onAdd, onError }: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Card field not ready');

      const result = await stripe.createPaymentMethod({
        type: 'card',
        card,
        billing_details: { name: name.trim() || undefined },
      });

      if (result.error) {
        setError(result.error.message || 'Card validation failed');
        onError?.(result.error.message || 'Card validation failed');
      } else if (result.paymentMethod) {
        const card = result.paymentMethod.card!;
        const brand = card.brand.charAt(0).toUpperCase() + card.brand.slice(1);
        onAdd({
          type: 'card',
          last4: card.last4,
          brand,
          label: `${brand} ending in ${card.last4}`,
          isDefault: false,
          stripePaymentMethodId: result.paymentMethod.id,
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Unexpected error - please try again';
      setError(msg);
      onError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cardholder name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name on card"
          autoComplete="cc-name"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Card details</label>
        <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3.5">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '15px',
                  color: '#0F172A',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  '::placeholder': { color: '#94A3B8' },
                },
                invalid: { color: '#E11D48' },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
        Your card is processed by Stripe. Barry never sees or stores your card number.
      </p>

      {error && (
        <p className="text-xs text-rose-600 leading-snug">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!stripe || busy || !name.trim()}
        className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Saving card...' : 'Save card'}
      </button>
    </div>
  );
}

/** Public wrapper that loads Stripe + provides <Elements> context */
export function StripeAddCard({ onAdd, onError }: StripeCardFormProps) {
  const [stripeInstance, setStripeInstance] = useState<Stripe | null | undefined>(undefined);

  useEffect(() => {
    const p = getStripe();
    if (!p) {
      setStripeInstance(null); // no key configured
      return;
    }
    p.then(s => setStripeInstance(s));
  }, []);

  if (stripeInstance === undefined) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading payment form...</p>;
  }

  if (stripeInstance === null) {
    return (
      <div className="space-y-3">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Payments not yet enabled</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 leading-snug">
            We&rsquo;re wrapping up our payment provider integration. You&rsquo;ll be able to save a card
            once we go live. In the meantime, you can still create and plan Barrys - bookings are
            ready to settle as soon as payments are switched on.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripeInstance}>
      <StripeCardForm onAdd={onAdd} onError={onError} />
    </Elements>
  );
}
