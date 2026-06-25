'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';

type Mode = 'login' | 'register';
type IdentifierType = 'email' | 'phone';
type Step = 'credentials' | 'otp';

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  return { score: Math.min(score, 5), label: labels[Math.min(score, 5)], color: colors[Math.min(score, 5)] };
}

function StrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: score >= i ? color : '#e5e7eb' }} />
        ))}
      </div>
      {label && <p className="text-xs font-medium" style={{ color }}>{label}</p>}
    </div>
  );
}

function OtpStep({ type, target, onDone }: { type: 'email' | 'phone'; target: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  // ── Resend cooldown ─────────────────────────────────────────────────────────
  // Mirrors the backend's 60s OTP_COOLDOWN_MS (otp.service.ts). A code was
  // already sent the moment this step mounted (via registration), so the
  // cooldown starts immediately rather than waiting for a first resend.
  const RESEND_COOLDOWN = 60;
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      if (type === 'phone') await api.verifyPhone(code.trim());
      else await api.verifyEmail(code.trim());
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Verification failed.');
    } finally { setLoading(false); }
  }

  async function resend() {
    if (cooldown > 0) return;
    setError('');
    try {
      if (type === 'phone') await api.sendPhoneOtp();
      else await api.sendEmailOtp();
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        // If the backend's own cooldown (429) fired — e.g. another tab
        // already resent — sync our timer to the seconds it reports
        // instead of leaving the button enabled.
        const match = err.message.match(/(\d+)s/);
        setCooldown(match ? Number(match[1]) : RESEND_COOLDOWN);
      } else {
        setError('Could not resend code.');
      }
    }
  }

  const maskedTarget = type === 'email'
    ? target.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : target.replace(/(\d{3})\d+(\d{3})/, '$1*****$2');

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="text-center">
        <p className="text-3xl mb-3">{type === 'phone' ? '📱' : '📧'}</p>
        <h2 className="text-xl font-bold">Check your {type === 'phone' ? 'phone' : 'email'}</h2>
        <p className="mt-1 text-sm opacity-60">
          We sent a 6-digit code to <strong>{maskedTarget}</strong>
        </p>
      </div>
      <form onSubmit={verify} className="space-y-4">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric" maxLength={6} placeholder="000000" autoFocus
          className="w-full rounded-xl border border-border bg-background p-3 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
        {resent && <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">✓ New code sent.</p>}
        <button type="submit" disabled={loading || code.length !== 6}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm">
        <button
          onClick={resend}
          disabled={cooldown > 0}
          className="text-primary underline hover:no-underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        </button>
        <button onClick={onDone} className="opacity-50 hover:opacity-70">Skip for now</button>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border bg-background p-3 text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    hasError ? 'border-red-500 focus:ring-red-500' : 'border-border',
  ].join(' ');
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-[18px] h-[18px]">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-[18px] h-[18px]">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/shop';
  const defaultMode = (searchParams.get('mode') as Mode) || 'login';

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [identifierType, setIdentifierType] = useState<IdentifierType>('email');
  const [step, setStep] = useState<Step>('credentials');
  const [otpTarget, setOtpTarget] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const { data: meData, isSuccess, isFetching } = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
    staleTime: 0, // always fetch fresh — never redirect based on stale cache
  });
  useEffect(() => {
    if (isSuccess && !isFetching && meData?.data?.user) window.location.replace(next);
  }, [meData, isSuccess, isFetching, next]);

  function validateField(field: string, value: string): string {
    if (field === 'name' && mode === 'register') {
      if (!value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name is too short';
    }
    if (field === 'identifier') {
      if (!value.trim()) return identifierType === 'email' ? 'Email is required' : 'Phone number is required';
      if (identifierType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      if (identifierType === 'phone' && value.replace(/\D/g, '').length < 7) return 'Enter a valid phone number';
    }
    if (field === 'password') {
      if (!value) return 'Password is required';
      if (mode === 'register' && value.length < 8) return 'Password must be at least 8 characters';
    }
    return '';
  }

  function handleBlur(field: string, value: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  }

  function validateAll(): boolean {
    const fields: Record<string, string> = { identifier, password };
    if (mode === 'register') fields.name = name;
    const errors: Record<string, string> = {};
    const allTouched: Record<string, boolean> = {};
    for (const [field, value] of Object.entries(fields)) {
      const err = validateField(field, value);
      if (err) errors[field] = err;
      allTouched[field] = true;
    }
    setFieldErrors(errors);
    setTouched(allTouched);
    return Object.keys(errors).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError('');
    if (!validateAll()) return;
    setLoading(true);
    try {
      const body: Record<string, string> = { password };
      if (identifierType === 'email') body.email = identifier.toLowerCase();
      else body.phone = identifier;
      if (mode === 'register') {
        body.name = name.trim();
        await api.register(body);
        setOtpTarget(identifier);
        setOtpType(identifierType);
        setStep('otp');
      } else {
        await api.login(body);
        window.location.assign(next);
      }
    } catch (err) {
      setGlobalError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.');
    } finally { setLoading(false); }
  }

  if (step === 'otp') {
    return <OtpStep type={otpType} target={otpTarget} onDone={() => window.location.assign(next)} />;
  }

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1 text-sm opacity-60">
          {mode === 'login' ? 'Sign in to your Classic Closet account' : 'Join Classic Closet today'}
        </p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {mode === 'register' && (
          <Field label="Full name" error={touched.name ? fieldErrors.name : ''}>
            <input value={name} onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name', name)} autoComplete="name"
              placeholder="e.g. Amina Wanjiku"
              className={inputClass(!!touched.name && !!fieldErrors.name)} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted p-1">
          {(['email', 'phone'] as IdentifierType[]).map((t) => (
            <button key={t} type="button"
              onClick={() => { setIdentifierType(t); setIdentifier(''); setFieldErrors((e) => ({ ...e, identifier: '' })); setTouched((v) => ({ ...v, identifier: false })); }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${identifierType === t ? 'bg-background shadow-sm' : 'opacity-60 hover:opacity-80'}`}>
              {t === 'email' ? 'Email' : 'Phone'}
            </button>
          ))}
        </div>

        <Field label={identifierType === 'email' ? 'Email address' : 'Phone number'} error={touched.identifier ? fieldErrors.identifier : ''}>
          <input value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); if (touched.identifier) setFieldErrors((fe) => ({ ...fe, identifier: validateField('identifier', e.target.value) })); }}
            onBlur={() => handleBlur('identifier', identifier)}
            type={identifierType === 'email' ? 'email' : 'tel'}
            autoComplete={identifierType === 'email' ? 'email' : 'tel'}
            placeholder={identifierType === 'email' ? 'you@example.com' : '0712 345 678'}
            className={inputClass(!!touched.identifier && !!fieldErrors.identifier)} />
        </Field>

        <Field label="Password" error={touched.password ? fieldErrors.password : ''}>
          <div className="relative">
            <input value={password}
              onChange={(e) => { setPassword(e.target.value); if (touched.password) setFieldErrors((fe) => ({ ...fe, password: validateField('password', e.target.value) })); }}
              onBlur={() => handleBlur('password', password)}
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              className={`${inputClass(!!touched.password && !!fieldErrors.password)} pr-11`} />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {mode === 'register' && <StrengthBar password={password} />}
        </Field>

        {globalError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{globalError}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-bold text-primaryForeground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center text-sm opacity-70">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={() => { setMode((m) => m === 'login' ? 'register' : 'login'); setFieldErrors({}); setTouched({}); setGlobalError(''); }}
            className="font-semibold underline">
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-block text-2xl font-bold tracking-tight">ClasicCloset</a>
        </div>
        <Suspense fallback={<p className="text-center opacity-60">Loading…</p>}>
          <LoginContent />
        </Suspense>
      </div>
    </main>
  );
}
