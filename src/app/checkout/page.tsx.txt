'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';
import { money } from '@/lib/money';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'MPESA' | 'PAYSTACK';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    return (err.data as any)?.message || err.message || 'Something went wrong.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 animate-pulse">
      <div className="mb-4 h-10 w-56 rounded-xl bg-border" />
      <div className="mb-6 h-4 w-40 rounded-lg bg-border" />
      <div className="mb-6 h-32 rounded-3xl bg-border" />
      <div className="h-96 rounded-3xl bg-border" />
    </section>
  );
}

// ─── M-Pesa success ───────────────────────────────────────────────────────────

function MpesaSuccess({ phone }: { phone: string }) {
  return (
    <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-10 text-center">
      <p className="mb-3 text-4xl">📱</p>
      <h2 className="mb-2 text-2xl font-bold">Check your phone</h2>
      <p className="opacity-70">
        An M-Pesa STK push was sent to{' '}
        <strong className="font-semibold">{phone}</strong>. Enter your PIN to
        complete payment.
      </p>
      <p className="mt-2 text-sm opacity-50">
        Didn't receive it? Wait 30 seconds — it can be slightly delayed.
      </p>
      <a
        href="/orders"
        className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primaryForeground"
      >
        View my orders
      </a>
    </div>
  );
}

// ─── Cart summary ─────────────────────────────────────────────────────────────

function CartSummary({ items }: { items: any[] }) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mb-6 rounded-3xl border border-border bg-card p-5">
      <p className="mb-3 font-semibold">
        {itemCount} item{itemCount !== 1 ? 's' : ''} in your bag
      </p>
      <ul className="space-y-2">
        {items.map((item: any) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="opacity-80">
              {item.product?.name ?? 'Product'}{' '}
              <span className="opacity-50">× {item.quantity}</span>
            </span>
            <span className="font-medium">
              {money(Number(item.price) * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-border pt-3 font-bold">
        <span>Total</span>
        <span>{money(subtotal)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [method, setMethod] = useState<PaymentMethod>('MPESA');
  const [orderId, setOrderId] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaSuccess, setMpesaSuccess] = useState(false);

  // ── Auth: guests are redirected to login then returned here ──────────────────
  // Checkout is the ONE page that correctly requires auth.
  // The cart, shop, and product pages all work without login.
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false });

  useEffect(() => {
    if (me.error instanceof ApiRequestError && me.error.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent('/checkout')}`;
    }
  }, [me.error]);

  // ── Cart summary ─────────────────────────────────────────────────────────────
  const cart = useQuery({ queryKey: ['cart'], queryFn: api.cart });
  const cartItems: any[] = cart.data?.data?.cart?.items ?? [];
  const cartIsEmpty = cart.isSuccess && cartItems.length === 0;

  // ── Pre-fill M-Pesa phone from user account ──────────────────────────────────
  const user = me.data?.data?.user;
  useEffect(() => {
    if (user?.phone && !mpesaPhone) {
      setMpesaPhone(user.phone);
    }
  }, [user?.phone]);

  // ── Create order ─────────────────────────────────────────────────────────────
  const checkout = useMutation({
    mutationFn: (body: any) => api.checkout(body),
    onSuccess: (r) => setOrderId(r.data.order.id),
  });

  // ── Trigger payment ──────────────────────────────────────────────────────────
  const pay = useMutation({
    mutationFn: async () => {
      if (method === 'PAYSTACK') {
        const r = await api.paystack(orderId);
        // Paystack returns authorization_url (snake_case) — handle both casings
        const url = r.data?.authorizationUrl ?? r.data?.authorization_url;
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No payment URL returned from Paystack.');
        }
        return;
      }
      // M-Pesa STK push
      await api.mpesa(orderId, mpesaPhone);
    },
    onSuccess: () => {
      if (method === 'MPESA') setMpesaSuccess(true);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const shippingPhone = String(f.get('phone') || '');

    // Carry shipping phone into M-Pesa field if user hasn't typed one separately
    if (method === 'MPESA' && !mpesaPhone) {
      setMpesaPhone(shippingPhone);
    }

    checkout.mutate({
      paymentMethod: method,
      shippingAddress: {
        firstName: f.get('firstName'),
        lastName: f.get('lastName'),
        phone: shippingPhone,
        email: f.get('email'),
        address1: f.get('address1'),
        city: f.get('city'),
        county: f.get('county'),
        country: 'Kenya',
      },
    });
  }

  // ── States ───────────────────────────────────────────────────────────────────

  if (me.isLoading) return <CheckoutSkeleton />;

  if (me.error instanceof ApiRequestError && me.error.status === 401) {
    return (
      <p className="p-10 text-center opacity-60">Redirecting to sign in…</p>
    );
  }

  if (mpesaSuccess) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <MpesaSuccess phone={mpesaPhone} />
      </section>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-4xl font-bold">Secure Checkout</h1>
      <p className="mb-8 text-sm opacity-60">
        Signed in as{' '}
        <span className="font-medium">{user?.email || user?.phone}</span>
      </p>

      {/* Cart summary — shown until order is created */}
      {!orderId && cartItems.length > 0 && <CartSummary items={cartItems} />}

      {/* Empty cart warning */}
      {!orderId && cartIsEmpty && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-8 text-center opacity-60">
          <p className="mb-2 font-semibold">Your bag is empty</p>
          <a href="/shop" className="text-sm underline">
            Continue shopping
          </a>
        </div>
      )}

      {/* Errors */}
      {checkout.error && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          {getError(checkout.error)}
        </p>
      )}
      {pay.error && (
        <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
          {getError(pay.error)}
        </p>
      )}

      {/* ── Step 1: Shipping + payment method form ─────────────────────────── */}
      {!orderId && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2"
        >
          <input
            name="firstName"
            required
            placeholder="First name"
            autoComplete="given-name"
            className="rounded-xl border border-border bg-background p-3"
          />
          <input
            name="lastName"
            required
            placeholder="Last name"
            autoComplete="family-name"
            className="rounded-xl border border-border bg-background p-3"
          />
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            defaultValue={user?.email || ''}
            placeholder="Email address"
            className="rounded-xl border border-border bg-background p-3"
          />
          <input
            name="phone"
            required
            autoComplete="tel"
            defaultValue={user?.phone || ''}
            placeholder="Phone e.g. 0712 345 678"
            className="rounded-xl border border-border bg-background p-3"
          />
          <input
            name="address1"
            required
            autoComplete="street-address"
            placeholder="Delivery address"
            className="rounded-xl border border-border bg-background p-3 sm:col-span-2"
          />
          <input
            name="city"
            required
            autoComplete="address-level2"
            placeholder="City / Town"
            className="rounded-xl border border-border bg-background p-3"
          />
          <input
            name="county"
            autoComplete="address-level1"
            placeholder="County (optional)"
            className="rounded-xl border border-border bg-background p-3"
          />

          {/* Payment method toggle */}
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold opacity-60">
              Payment method
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
              {(
                [
                  { value: 'MPESA', label: '📱 M-Pesa' },
                  { value: 'PAYSTACK', label: '💳 Card / Paystack' },
                ] as { value: PaymentMethod; label: string }[]
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    method === value
                      ? 'bg-primary text-primaryForeground shadow-sm'
                      : 'opacity-60 hover:opacity-80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* M-Pesa phone — collected here upfront, not after order creation */}
          {method === 'MPESA' && (
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-sm font-semibold opacity-60">
                M-Pesa number to charge
              </p>
              <input
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                required
                placeholder="e.g. 0712 345 678 or 254712345678"
                className="w-full rounded-xl border border-border bg-background p-3"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={checkout.isPending || cartIsEmpty}
            className="rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
          >
            {checkout.isPending ? 'Creating order…' : 'Place order'}
          </button>
        </form>
      )}

      {/* ── Step 2: Payment trigger ────────────────────────────────────────── */}
      {orderId && !mpesaSuccess && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="mb-1 font-semibold">Order created — complete your payment</p>
          <p className="mb-5 text-sm opacity-60">
            Your items are reserved. Complete payment to confirm.
          </p>

          {/* Allow editing M-Pesa number before paying */}
          {method === 'MPESA' && (
            <div className="mb-4">
              <p className="mb-1.5 text-sm font-semibold opacity-60">
                M-Pesa number
              </p>
              <input
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
                className="w-full rounded-xl border border-border bg-background p-3"
              />
            </div>
          )}

          <button
            disabled={
              pay.isPending || (method === 'MPESA' && !mpesaPhone.trim())
            }
            onClick={() => pay.mutate()}
            className="w-full rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pay.isPending
              ? 'Processing…'
              : method === 'MPESA'
              ? 'Send M-Pesa STK push'
              : 'Continue to Paystack'}
          </button>
        </div>
      )}
    </section>
  );
}
