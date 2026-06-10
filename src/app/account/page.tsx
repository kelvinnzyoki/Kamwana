'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiFetch, ApiRequestError } from '@/lib/api';

function getError(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function VerifyBadge({
  verified,
  type,
  onSend,
}: {
  verified: boolean;
  type: 'email' | 'phone';
  onSend: () => void;
}) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        ✓ Verified
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSend}
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors"
    >
      ⚠ Verify {type}
    </button>
  );
}

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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sendOtp =
      type === 'phone' ? api.sendPhoneOtp : api.sendEmailOtp;

    if (!sendOtp) {
      setError(`${type} verification endpoint is not available yet.`);
      return;
    }

    sendOtp()
      .then(() => setSent(true))
      .catch((err: unknown) => setError(getError(err)));
  }, [type]);

  async function verify() {
    setError('');
    setLoading(true);

    try {
      if (type === 'phone') {
        await api.verifyPhone(code.trim());
      } else {
        await api.verifyEmail(code.trim());
      }

      onVerified();
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Verify your {type === 'phone' ? 'phone' : 'email'}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-lg opacity-40 hover:opacity-70"
          >
            ✕
          </button>
        </div>

        {sent && (
          <p className="text-sm opacity-60">
            A 6-digit code was sent to your{' '}
            {type === 'phone' ? 'phone number' : 'email address'}.
          </p>
        )}

        <input
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoFocus
          className="w-full rounded-xl border border-border bg-muted p-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={verify}
          disabled={loading || code.length !== 6}
          className="w-full rounded-full bg-primary py-2.5 font-bold text-primaryForeground disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const queryClient = useQueryClient();

  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
  });

  const user = meData?.data?.user;

  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [otpModal, setOtpModal] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/login?next=/account';
    }
  }, [isLoading, user]);

  const saveName = useMutation({
    mutationFn: () =>
      apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded-xl bg-border" />
        <div className="h-40 rounded-2xl bg-border" />
        <div className="h-32 rounded-2xl bg-border" />
      </div>
    );
  }

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

      <Section title="Profile">
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Full name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>

            <div className="flex items-center gap-2">
              <p className="flex-1 truncate rounded-xl border border-border bg-muted px-3 py-2.5 text-sm opacity-60">
                {user.email ?? '—'}
              </p>

              {user.email && (
                <VerifyBadge
                  verified={Boolean(user.emailVerified)}
                  type="email"
                  onSend={() => setOtpModal('email')}
                />
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>

            <div className="flex items-center gap-2">
              <p className="flex-1 truncate rounded-xl border border-border bg-muted px-3 py-2.5 text-sm opacity-60">
                {user.phone ?? '—'}
              </p>

              {user.phone && (
                <VerifyBadge
                  verified={Boolean(user.phoneVerified)}
                  type="phone"
                  onSend={() => setOtpModal('phone')}
                />
              )}
            </div>
          </div>

          {saveName.error && (
            <p className="text-sm text-red-600">
              {getError(saveName.error)}
            </p>
          )}

          <button
            type="button"
            onClick={() => saveName.mutate()}
            disabled={
              saveName.isPending || !name.trim() || name.trim() === user.name
            }
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primaryForeground disabled:opacity-40 transition-opacity"
          >
            {saveName.isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </Section>

      <Section title="My account">
        <div className="space-y-1">
          {[
            {
              label: 'Order history',
              href: '/orders',
              desc: 'View all your past orders',
            },
            {
              label: 'Shop',
              href: '/shop',
              desc: 'Continue browsing',
            },
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

              <span className="text-sm opacity-30">→</span>
            </a>
          ))}
        </div>
      </Section>

      <Section title="Session">
        <button
          type="button"
          onClick={() => api.logout().then(() => (window.location.href = '/'))}
          className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Sign out
        </button>
      </Section>
    </main>
  );
        }
