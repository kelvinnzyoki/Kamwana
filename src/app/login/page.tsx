'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'login' | 'register';
type IdentifierType = 'email' | 'phone';
type Step = 'credentials' | 'verify-phone';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReadableError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const data = error.data as any;
    return data?.message || error.message || 'Authentication failed.';
  }
  if (error instanceof Error) return error.message;
  return 'Authentication failed.';
}

// ─── OTP verification step ────────────────────────────────────────────────────

function PhoneVerifyStep({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = code.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      await api.verifyPhone(trimmed);
      onDone();
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    try {
      await api.sendPhoneOtp();
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(getReadableError(err));
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Verify your phone</h1>
      <p className="mb-6 text-sm opacity-70">
        We sent a 6-digit code to your phone number. Enter it below.
      </p>

      <form onSubmit={handleVerify} className="space-y-4 rounded-3xl border border-border bg-card p-6">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          className="w-full rounded-xl border border-border bg-background p-3 text-center text-2xl tracking-widest"
          autoFocus
        />

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </p>
        )}

        {resent && (
          <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
            Code resent successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Verifying...' : 'Verify phone'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleResend}
            className="underline opacity-70 hover:opacity-100"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={onDone}
            className="opacity-50 hover:opacity-80"
          >
            Skip for now
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Credentials step ─────────────────────────────────────────────────────────

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/shop';

  const [mode, setMode] = useState<Mode>('login');
  const [identifierType, setIdentifierType] = useState<IdentifierType>('email');
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show phone OTP step after registration with a phone number
  if (step === 'verify-phone') {
    return <PhoneVerifyStep onDone={() => window.location.assign(next)} />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get('name') || '').trim();
      const identifier = String(form.get('identifier') || '').trim();
      const password = String(form.get('password') || '');

      if (!identifier) {
        throw new Error(
          identifierType === 'email'
            ? 'Enter your email address.'
            : 'Enter your phone number.'
        );
      }

      if (!password) throw new Error('Enter your password.');

      const body: Record<string, string> = { password };

      if (identifierType === 'email') {
        body.email = identifier.toLowerCase();
      } else {
        body.phone = identifier;
      }

      if (mode === 'register') {
        if (!name) throw new Error('Enter your full name.');
        body.name = name;

        await api.register(body);

        // After phone registration, go to verification step.
        // After email registration, go directly to destination.
        if (identifierType === 'phone') {
          // OTP was auto-sent by the backend on registration — show verify step
          setStep('verify-phone');
        } else {
          window.location.assign(next);
        }
      } else {
        await api.login(body);
        window.location.assign(next);
      }
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setError('');
    setMode(mode === 'login' ? 'register' : 'login');
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="mb-6 text-sm opacity-70">
        Continue shopping, save your bag, and checkout securely.
      </p>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
        {/* Name — register only */}
        {mode === 'register' && (
          <input
            name="name"
            required
            placeholder="Full name"
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-background p-3"
          />
        )}

        {/* Identifier type toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => { setIdentifierType('email'); setError(''); }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              identifierType === 'email'
                ? 'bg-primary text-primaryForeground shadow-sm'
                : 'opacity-60 hover:opacity-80'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => { setIdentifierType('phone'); setError(''); }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              identifierType === 'phone'
                ? 'bg-primary text-primaryForeground shadow-sm'
                : 'opacity-60 hover:opacity-80'
            }`}
          >
            Phone
          </button>
        </div>

        {/* Identifier input */}
        <input
          name="identifier"
          required
          type={identifierType === 'email' ? 'email' : 'tel'}
          autoComplete={identifierType === 'email' ? 'email' : 'tel'}
          placeholder={
            identifierType === 'email'
              ? 'Email address'
              : 'e.g. 0712 345 678 or +254712345678'
          }
          className="w-full rounded-xl border border-border bg-background p-3"
        />

        {/* Password */}
        <input
          name="password"
          required
          type="password"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          minLength={mode === 'register' ? 8 : 1}
          placeholder={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
          className="w-full rounded-xl border border-border bg-background p-3"
        />

        {/* Error */}
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? 'Please wait…'
            : mode === 'login'
            ? 'Sign in'
            : 'Create account'}
        </button>

        {/* Mode toggle */}
        <p className="text-center text-sm opacity-70">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold underline">
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>

        {/* Guest cart notice */}
        {mode === 'login' && (
          <p className="text-center text-xs opacity-50">
            Your bag will be saved when you sign in.
          </p>
        )}
      </form>
    </section>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center opacity-60">Loading…</p>}>
      <LoginContent />
    </Suspense>
  );
}
