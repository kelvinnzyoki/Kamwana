'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';

function getReadableError(error: unknown) {
  if (error instanceof ApiRequestError) {
    const data = error.data as any;
    return data?.message || error.message || 'Authentication failed.';
  }
  if (error instanceof Error) return error.message;
  return 'Authentication failed.';
}

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/shop';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get('name') || '').trim();
      const identifier = String(form.get('identifier') || '').trim();
      const password = String(form.get('password') || '');

      if (!identifier || !password) {
        throw new Error('Enter your email/phone and password.');
      }

      const body: Record<string, string> = { password };

      if (identifierType === 'email') body.email = identifier.toLowerCase();
      else body.phone = identifier;

      if (mode === 'register') {
        if (!name) throw new Error('Enter your full name.');
        body.name = name;
        await api.register(body);
      } else {
        await api.login(body);
      }

      window.location.assign(next);
    } catch (error) {
      setError(getReadableError(error));
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
        Continue shopping, save your bag, and checkout securely.
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
          placeholder={identifierType === 'email' ? 'Email address' : 'Phone e.g. 0712345678 or 254712345678'}
          className="w-full rounded-xl border border-border bg-background p-3"
        />

        <input
          name="password"
          required
          type="password"
          minLength={mode === 'register' ? 8 : 1}
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background p-3"
        />

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
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
