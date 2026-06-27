'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';
import { money } from '@/lib/money';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'PAYSTACK';

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
  const [method] = useState<PaymentMethod>('PAYSTACK');
  const [orderId, setOrderId] = useState('');

  // ── Auth: guests are redirected to login then returned here ──────────────────
  // Checkout is the ONE page that correctly requires auth.
  // The cart, shop, and product pages all work without login.
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false });

  useEffect(() => {
    if (me.error instanceof ApiRequestError && me.error.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent('/checkout')}&intent=checkout`;
    }
  }, [me.error]);

  // ── Cart summary ─────────────────────────────────────────────────────────────
  const cart = useQuery({ queryKey: ['cart'], queryFn: api.cart });
  const cartItems: any[] = cart.data?.data?.cart?.items ?? [];
  const cartIsEmpty = cart.isSuccess && cartItems.length === 0;

  const user = me.data?.data?.user;

  // ── Create order ─────────────────────────────────────────────────────────────
  const checkout = useMutation({
    mutationFn: (body: any) => api.checkout(body),
    onSuccess: (r) => setOrderId(r.data.order.id),
  });

  // ── Trigger Paystack payment ─────────────────────────────────────────────────
  const pay = useMutation({
    mutationFn: async () => {
      const r = await api.paystack(orderId);
      // Paystack returns authorization_url (snake_case) — handle both casings
      const url = r.data?.authorizationUrl ?? r.data?.authorization_url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No payment URL returned from Paystack.');
      }
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    checkout.mutate({
      paymentMethod: method,
      shippingAddress: {
        firstName: f.get('firstName'),
        lastName: f.get('lastName'),
        phone: String(f.get('phone') || ''),
        email: f.get('email'),
        address1: f.get('address1'),
        address2: f.get('address2'),
        city: f.get('city'),
        county: f.get('county'),
        postalCode: f.get('postalCode'),
        country: f.get('country') || 'Kenya',
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
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="lastName"
            required
            placeholder="Last name"
            autoComplete="family-name"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            defaultValue={user?.email || ''}
            placeholder="Email address"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="phone"
            required
            autoComplete="tel"
            defaultValue={user?.phone || ''}
            placeholder="Phone e.g. 0712 345 678"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="address1"
            required
            autoComplete="address-line1"
            placeholder="Delivery address / Street address"
            className="min-w-0 rounded-xl border border-border bg-background p-3 sm:col-span-2"
          />
          <input
            name="address2"
            autoComplete="address-line2"
            placeholder="Apartment, building, landmark (optional)"
            className="min-w-0 rounded-xl border border-border bg-background p-3 sm:col-span-2"
          />
          <input
            name="city"
            required
            autoComplete="address-level2"
            placeholder="City / Town"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="county"
            autoComplete="address-level1"
            placeholder="County (optional)"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="postalCode"
            autoComplete="postal-code"
            placeholder="Postal code (optional)"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />
          <input
            name="country"
            required
            autoComplete="country-name"
            defaultValue="Kenya"
            placeholder="Country"
            className="min-w-0 rounded-xl border border-border bg-background p-3"
          />

          {/* Payment method */}
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold opacity-60">
              Payment method
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
              <div className="rounded-lg border border-border bg-muted px-3 py-2.5 text-center">
                <div className="text-sm font-semibold opacity-60">📱 M-Pesa</div>
                <div className="mt-1 text-xs font-medium text-amber-600">
                  Coming Soon
                </div>
              </div>

              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primaryForeground shadow-sm"
                aria-pressed="true"
              >
                💳 Card / Paystack
              </button>
            </div>
          </div>

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
      {orderId && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="mb-1 font-semibold">Order created — complete your payment</p>
          <p className="mb-5 text-sm opacity-60">
            Your items are reserved. Complete payment to confirm.
          </p>

          <button
            disabled={pay.isPending}
            onClick={() => pay.mutate()}
            className="w-full rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pay.isPending ? 'Processing…' : 'Continue to Paystack'}
          </button>
        </div>
      )}
    </section>
  );
}
