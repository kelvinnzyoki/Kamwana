'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiFetch, ApiRequestError } from '@/lib/api';

function getError(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}

// ─── OTP verification modal ───────────────────────────────────────────────────

function OtpModal({
  type,
  onVerified,
  onClose,
}: {
  type: 'email' | 'phone';
  onVerified: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [initialSending, setInitialSending] = useState(true);

  // Cooldown mirrors otp.service.ts OTP_COOLDOWN_MS = 60s.
  // This modal sends the OTP when opened, then starts cooldown only after
  // the backend confirms the code was sent.
  const COOLDOWN = 60;
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);


  async function sendCode(initial = false) {
    if (!initial && cooldown > 0) return;
    if (initial) setInitialSending(true);
    else setResending(true);
    setError('');
    try {
      if (type === 'phone') await api.sendPhoneOtp();
      else await api.sendEmailOtp();
      setResent(!initial);
      setCooldown(COOLDOWN);
      if (!initial) setTimeout(() => setResent(false), 4000);
    } catch (e) {
      const msg = getError(e);
      setError(msg);
      const match = msg.match(/(\d+)s/);
      if (match) setCooldown(Number(match[1]));
    } finally {
      if (initial) setInitialSending(false);
      else setResending(false);
    }
  }

  useEffect(() => {
    void sendCode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      if (type === 'phone') await api.verifyPhone(code.trim());
      else await api.verifyEmail(code.trim());
      onVerified();
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }

  async function resend() {
    await sendCode(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Verify your {type === 'phone' ? 'phone number' : 'email address'}
          </h3>
          <button onClick={onClose} className="opacity-40 hover:opacity-70 text-lg leading-none">✕</button>
        </div>

        <p className="text-sm opacity-60">
          {initialSending ? 'Sending code to your ' : 'A 6-digit code was sent to your '}{type === 'phone' ? 'phone' : 'email'}.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoFocus
          className="w-full rounded-xl border border-border bg-muted p-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {resent && <p className="text-sm text-green-600">✓ New code sent.</p>}

        <button
          onClick={verify}
          disabled={loading || initialSending || code.length !== 6}
          className="w-full rounded-full bg-primary py-2.5 font-bold text-primaryForeground disabled:opacity-50"
        >
          {initialSending ? 'Sending code…' : loading ? 'Verifying…' : 'Confirm'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            onClick={resend}
            disabled={initialSending || cooldown > 0 || resending}
            className="text-primary underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
          >
            {cooldown > 0 ? `Resend code (${cooldown}s)` : resending ? 'Sending…' : 'Resend code'}
          </button>
          <button onClick={onClose} className="opacity-40 hover:opacity-70">Skip</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add contact field ────────────────────────────────────────────────────────
// Shown when a user is missing either phone or email. Submitting adds the
// value to their account and opens the OTP modal for immediate verification.

function AddContactField({
  type,
  onAdded,
}: {
  type: 'phone' | 'email';
  onAdded: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) { setError(`Enter a ${type === 'phone' ? 'phone number' : 'valid email'}`); return; }
    setLoading(true); setError('');
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(type === 'phone' ? { phone: value } : { email: value }),
      });
      onAdded();
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type={type === 'email' ? 'email' : 'tel'}
          autoComplete={type === 'email' ? 'email' : 'tel'}
          placeholder={type === 'phone' ? 'e.g. 0712 345 678' : 'you@example.com'}
          className="flex-1 rounded-xl border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primaryForeground disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Saving…' : 'Add & verify'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

// ─── Verify badge ─────────────────────────────────────────────────────────────

function VerifyBadge({ verified, onSend }: { verified: boolean; onSend: () => void }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
        ✓ Verified
      </span>
    );
  }
  return (
    <button
      onClick={onSend}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-200 transition-colors"
    >
      ⚠ Verify
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const queryClient = useQueryClient();

  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
  });

  const user = meData?.data?.user;

  const [name, setName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [otpModal, setOtpModal] = useState<'email' | 'phone' | null>(null);

  // Which contact field was just added (triggers OTP modal automatically)
  const [justAdded, setJustAdded] = useState<'phone' | 'email' | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (!isLoading && !user) window.location.href = '/login?next=/account';
  }, [isLoading, user]);

  // Open OTP modal immediately after adding a contact field
  useEffect(() => {
    if (justAdded) {
      setOtpModal(justAdded);
      setJustAdded(null);
    }
  }, [justAdded]);

  const saveName = useMutation({
    mutationFn: () =>
      apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    },
  });

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded-xl bg-border" />
        <div className="h-40 rounded-2xl bg-border" />
        <div className="h-40 rounded-2xl bg-border" />
      </div>
    );
  }

  const hasRealEmail = user.email && !user.email.endsWith('@phone.classic-closet.local');
  const hasPhone = !!user.phone;

  return (
    <main className="mx-auto max-w-lg px-4 py-10 space-y-5">

      {otpModal && (
        <OtpModal
          type={otpModal}
          onVerified={() => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            setOtpModal(null);
          }}
          onClose={() => setOtpModal(null)}
        />
      )}

      <h1 className="text-3xl font-bold">Account</h1>

      {/* ── Profile ───────────────────────────────────────────────────────── */}
      <Section title="Profile">
        <div className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email address</label>
            {hasRealEmail ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm opacity-60 truncate">
                  {user.email}
                </p>
                <VerifyBadge
                  verified={user.emailVerified}
                  onSend={() => setOtpModal('email')}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs opacity-50">
                  You signed up with a phone number. Add an email for an alternative way to sign in.
                </p>
                <AddContactField
                  type="email"
                  onAdded={() => {
                    queryClient.invalidateQueries({ queryKey: ['me'] });
                    setJustAdded('email');
                  }}
                />
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone number</label>
            {hasPhone ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm opacity-60 truncate">
                  {user.phone}
                </p>
                <VerifyBadge
                  verified={user.phoneVerified}
                  onSend={() => setOtpModal('phone')}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs opacity-50">
                  You signed up with an email. Add a phone number to enable M-Pesa payments and SMS updates.
                </p>
                <AddContactField
                  type="phone"
                  onAdded={() => {
                    queryClient.invalidateQueries({ queryKey: ['me'] });
                    setJustAdded('phone');
                  }}
                />
              </div>
            )}
          </div>

          <button
            onClick={() => saveName.mutate()}
            disabled={saveName.isPending || !name.trim() || name.trim() === user.name}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primaryForeground disabled:opacity-40 transition-opacity"
          >
            {saveName.isPending ? 'Saving…' : nameSaved ? '✓ Saved' : 'Save name'}
          </button>
        </div>
      </Section>

      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <Section title="My account">
        <div className="space-y-1">
          {[
            { label: 'Order history', href: '/orders', desc: 'View all your past orders' },
            { label: 'Shop', href: '/shop', desc: 'Continue browsing' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-muted transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs opacity-50">{link.desc}</p>
              </div>
              <span className="opacity-30 text-sm">→</span>
            </a>
          ))}
        </div>
      </Section>

      {/* ── Session ───────────────────────────────────────────────────────── */}
      <Section title="Session">
        <button
          onClick={() => api.logout().then(() => (window.location.href = '/'))}
          className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Sign out
        </button>
      </Section>

    </main>
  );
}
