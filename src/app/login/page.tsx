'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verificationTarget, setVerificationTarget] = useState('');
  const [verificationType, setVerificationType] = useState<'email' | 'phone'>('email');

  const nextUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/shop';
    return new URLSearchParams(window.location.search).get('next') || '/shop';
  }, []);

  const auth = useMutation({
    mutationFn: async (body: any) => (mode === 'login' ? api.login(body) : api.register(body)),
    onSuccess: (res, body: any) => {
      setError('');
      setNotice(mode === 'register' ? 'Account created. You can verify email or phone now.' : 'Signed in successfully.');

      const user = res?.data?.user;
      setVerificationTarget(user?.email || body.email || body.identifier || '');
      setVerificationType('email');

      if (mode === 'login') window.location.href = nextUrl;
    },
    onError: (err: any) => setError(err.message || 'Authentication failed'),
  });

  const sendCode = useMutation({
    mutationFn: async () => {
      if (!verificationTarget) throw new Error('Enter email or phone first');
      return verificationType === 'email'
        ? api.sendEmailCode(verificationTarget)
        : api.sendPhoneCode(verificationTarget);
    },
    onSuccess: () => {
      setError('');
      setNotice(`Verification code sent to your ${verificationType}.`);
    },
    onError: (err: any) => setError(err.message || 'Could not send code'),
  });

  const verifyCode = useMutation({
    mutationFn: async (code: string) => {
      if (!verificationTarget) throw new Error('Missing verification target');
      return verificationType === 'email'
        ? api.verifyEmailCode(verificationTarget, code)
        : api.verifyPhoneCode(verificationTarget, code);
    },
    onSuccess: () => {
      setError('');
      setNotice(`${verificationType === 'email' ? 'Email' : 'Phone'} verified successfully.`);
      window.location.href = nextUrl;
    },
    onError: (err: any) => setError(err.message || 'Verification failed'),
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(f);
    auth.mutate(body);
  }

  function submitVerification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    verifyCode.mutate(String(f.get('code') || ''));
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
      <p className="mb-6 text-sm opacity-70">
        Shop freely, save your cart, and continue securely at checkout.
      </p>

      {error && <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {notice && <p className="mb-4 rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-700">{notice}</p>}

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border p-6">
        {mode === 'register' && (
          <input name="name" required placeholder="Full name" className="w-full rounded-xl border border-border bg-background p-3" />
        )}

        {mode === 'login' ? (
          <input
            name="identifier"
            required
            placeholder="Email or Safaricom phone"
            className="w-full rounded-xl border border-border bg-background p-3"
          />
        ) : (
          <>
            <input name="email" required type="email" placeholder="Email" className="w-full rounded-xl border border-border bg-background p-3" />
            <input name="phone" placeholder="Safaricom phone e.g. 0712345678" className="w-full rounded-xl border border-border bg-background p-3" />
          </>
        )}

        <input name="password" required type="password" placeholder="Password" className="w-full rounded-xl border border-border bg-background p-3" />

        <button disabled={auth.isPending} className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground">
          {auth.isPending ? 'Please wait...' : 'Continue'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
            setNotice('');
          }}
          className="text-sm underline"
        >
          Switch to {mode === 'login' ? 'register' : 'login'}
        </button>
      </form>

      <div className="mt-6 rounded-3xl border border-border p-6">
        <h2 className="mb-3 font-bold">Verify account</h2>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVerificationType('email')}
            className={`rounded-xl border border-border p-2 ${verificationType === 'email' ? 'bg-primary text-primaryForeground' : ''}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setVerificationType('phone')}
            className={`rounded-xl border border-border p-2 ${verificationType === 'phone' ? 'bg-primary text-primaryForeground' : ''}`}
          >
            Phone
          </button>
        </div>

        <input
          value={verificationTarget}
          onChange={(e) => setVerificationTarget(e.target.value)}
          placeholder={verificationType === 'email' ? 'Email address' : 'Phone e.g. 0712345678'}
          className="mb-3 w-full rounded-xl border border-border bg-background p-3"
        />

        <button
          type="button"
          disabled={sendCode.isPending}
          onClick={() => sendCode.mutate()}
          className="mb-4 w-full rounded-full border border-border py-3 font-semibold"
        >
          {sendCode.isPending ? 'Sending...' : 'Send verification code'}
        </button>

        <form onSubmit={submitVerification} className="flex gap-2">
          <input name="code" required inputMode="numeric" maxLength={6} placeholder="6-digit code" className="min-w-0 flex-1 rounded-xl border border-border bg-background p-3" />
          <button disabled={verifyCode.isPending} className="rounded-xl bg-foreground px-4 font-bold text-background">
            Verify
          </button>
        </form>
      </div>
    </section>
  );
}
