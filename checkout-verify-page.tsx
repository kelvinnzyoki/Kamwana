'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';

type State = 'verifying' | 'success' | 'failed';

function VerifyContent() {
  const searchParams = useSearchParams();

  // Paystack sends both ?reference= and ?trxref= — reference is the canonical one
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [state, setState] = useState<State>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setState('failed');
      setError('No payment reference in the URL.');
      return;
    }

    api
      .verifyPaystack(reference)
      .then(() => setState('success'))
      .catch((err: unknown) => {
        setState('failed');
        if (err instanceof ApiRequestError) {
          // "Payment not completed" is a legitimate Paystack decline — show it
          setError(err.message);
        } else {
          setError('Could not verify payment. Contact support if you were charged.');
        }
      });
  }, [reference]);

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (state === 'verifying') {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <span className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Verifying your payment…</h1>
        <p className="opacity-60">Please wait — do not close or refresh this page.</p>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="text-center">
        <p className="mb-4 text-6xl">🎉</p>
        <h1 className="mb-2 text-3xl font-bold">Payment confirmed!</h1>
        <p className="mb-8 opacity-70">
          Your order is being processed. You'll receive an update shortly.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/orders"
            className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground"
          >
            View my orders
          </a>
          <a
            href="/shop"
            className="rounded-full border border-border px-8 py-3 font-bold"
          >
            Continue shopping
          </a>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  return (
    <div className="text-center">
      <p className="mb-4 text-6xl">⚠️</p>
      <h1 className="mb-2 text-3xl font-bold">Payment verification failed</h1>
      <p className="mb-2 opacity-70">{error}</p>
      {reference && (
        <p className="mb-8 text-sm opacity-50">
          Reference:{' '}
          <code className="rounded bg-border px-1 py-0.5 font-mono text-xs">
            {reference}
          </code>
          {' '}— keep this if you contact support.
        </p>
      )}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="/checkout"
          className="rounded-full border border-border px-8 py-3 font-bold"
        >
          Try again
        </a>
        <a
          href="/orders"
          className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground"
        >
          View my orders
        </a>
      </div>
    </div>
  );
}

export default function CheckoutVerifyPage() {
  return (
    <section className="mx-auto max-w-lg px-4 py-24">
      <Suspense
        fallback={
          <p className="text-center opacity-60">Loading…</p>
        }
      >
        <VerifyContent />
      </Suspense>
    </section>
  );
}
