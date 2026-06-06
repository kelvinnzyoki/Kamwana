'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/shop';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const password = String(form.get('password') || '');
      const name = String(form.get('name') || '');
      const identifier = String(form.get('identifier') || '').trim();

      if (!identifier || !password) {
        throw new Error('Enter your email/phone and password.');
      }

      const body: Record<string, string> = { password };

      if (identifierType === 'email') {
        body.email = identifier.toLowerCase();
      } else {
        body.phone = identifier;
      }

      if (mode === 'register') {
        body.name = name;
        await api.register(body);
      } else {
        await api.login(body);
      }

      window.location.href = next;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="mb-6 text-sm opacity-70">
        Sign in to continue checkout, view orders, and keep your cart saved.
      </p>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
        {mode === 'register' && (
          <input
            name="name"
            required
            placeholder="Full name"
            className="w-full rounded-xl border border-border bg-background p-3"
          />
        )}

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => setIdentifierType('email')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${identifierType === 'email' ? 'bg-primary text-primaryForeground' : ''}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setIdentifierType('phone')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${identifierType === 'phone' ? 'bg-primary text-primaryForeground' : ''}`}
          >
            Phone
          </button>
        </div>

        <input
          name="identifier"
          required
          type={identifierType === 'email' ? 'email' : 'tel'}
          placeholder={identifierType === 'email' ? 'Email address' : 'Phone number e.g. 2547XXXXXXXX'}
          className="w-full rounded-xl border border-border bg-background p-3"
        />

        <input
          name="password"
          required
          type="password"
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background p-3"
        />

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:opacity-60"
        >
          {loading ? 'Please wait...' : 'Continue'}
        </button>

        <button
          type="button"
          onClick={() => {
            setError('');
            setMode(mode === 'login' ? 'register' : 'login');
          }}
          className="text-sm underline"
        >
          Switch to {mode === 'login' ? 'register' : 'login'}
        </button>
      </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <LoginContent />
    </Suspense>
  );
}
