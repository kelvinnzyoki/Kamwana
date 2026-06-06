'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/shop';

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const password = String(form.get('password') || '');

      if (mode === 'login') {
        const login = String(form.get('login') || '');
        await api.login({ login, password });
      } else {
        await api.register({
          name: String(form.get('name') || ''),
          email: String(form.get('email') || ''),
          phone: String(form.get('phone') || ''),
          password,
        });
      }

      window.location.href = next;
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>

      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border p-6">
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}

        {mode === 'register' && (
          <>
            <input name="name" required placeholder="Full name" className="w-full rounded-xl border border-border bg-background p-3" />
            <input name="email" required type="email" placeholder="Email address" className="w-full rounded-xl border border-border bg-background p-3" />
            <input name="phone" placeholder="Phone number e.g. 2547XXXXXXXX" className="w-full rounded-xl border border-border bg-background p-3" />
          </>
        )}

        {mode === 'login' && (
          <input name="login" required placeholder="Email or phone number" className="w-full rounded-xl border border-border bg-background p-3" />
        )}

        <input name="password" required type="password" placeholder="Password" className="w-full rounded-xl border border-border bg-background p-3" />

        <button disabled={loading} className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:opacity-60">
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-sm underline">
          Switch to {mode === 'login' ? 'register' : 'login'}
        </button>
      </form>
    </section>
  );
}
