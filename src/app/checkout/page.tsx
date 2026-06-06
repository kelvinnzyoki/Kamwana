'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';

export default function Checkout() {
  const [method, setMethod] = useState<'MPESA' | 'PAYSTACK'>('MPESA');
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');

  const me = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
  });

  useEffect(() => {
    if (me.error instanceof ApiRequestError && me.error.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent('/checkout')}`;
    }
  }, [me.error]);

  const checkout = useMutation({
    mutationFn: (body: any) => api.checkout(body),
    onSuccess: (r) => setOrderId(r.data.order.id),
  });

  const pay = useMutation({
    mutationFn: async () => {
      if (method === 'PAYSTACK') {
        const r = await api.paystack(orderId);
        window.location.href = r.data.authorizationUrl;
        return;
      }

      await api.mpesa(orderId, phone);
    },
  });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);

    checkout.mutate({
      paymentMethod: method,
      shippingAddress: {
        firstName: f.get('firstName'),
        lastName: f.get('lastName'),
        phone: f.get('phone'),
        email: f.get('email'),
        address1: f.get('address1'),
        city: f.get('city'),
        county: f.get('county'),
        country: 'Kenya',
      },
    });
  }

  if (me.isLoading) {
    return <p className="p-8">Checking your session...</p>;
  }

  if (me.error instanceof ApiRequestError && me.error.status === 401) {
    return <p className="p-8">Redirecting to sign in...</p>;
  }

  const user = me.data?.data?.user;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-4xl font-bold">Secure Checkout</h1>
      <p className="mb-6 text-sm opacity-70">Signed in as {user?.email || user?.phone}</p>

      {checkout.error && <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{checkout.error.message}</p>}
      {pay.error && <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{pay.error.message}</p>}

      {!orderId ? (
        <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
          <input name="firstName" required placeholder="First name" className="rounded-xl border border-border bg-background p-3" />
          <input name="lastName" required placeholder="Last name" className="rounded-xl border border-border bg-background p-3" />
          <input name="email" required type="email" defaultValue={user?.email || ''} placeholder="Email" className="rounded-xl border border-border bg-background p-3" />
          <input name="phone" required defaultValue={user?.phone || ''} placeholder="Phone" className="rounded-xl border border-border bg-background p-3" />
          <input name="address1" required placeholder="Delivery address" className="rounded-xl border border-border bg-background p-3 sm:col-span-2" />
          <input name="city" required placeholder="City" className="rounded-xl border border-border bg-background p-3" />
          <input name="county" placeholder="County" className="rounded-xl border border-border bg-background p-3" />

          <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="rounded-xl border border-border bg-background p-3 sm:col-span-2">
            <option value="MPESA">M-Pesa STK</option>
            <option value="PAYSTACK">Paystack card/mobile money</option>
          </select>

          <button disabled={checkout.isPending} className="rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground sm:col-span-2">
            {checkout.isPending ? 'Creating order...' : 'Create order'}
          </button>
        </form>
      ) : (
        <div className="rounded-3xl border border-border p-6">
          <p className="mb-4">Order created. Complete payment.</p>
          {method === 'MPESA' && (
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2547XXXXXXXX" className="mb-4 w-full rounded-xl border border-border bg-background p-3" />
          )}
          <button disabled={pay.isPending} onClick={() => pay.mutate()} className="rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground">
            {pay.isPending ? 'Processing...' : 'Pay now'}
          </button>
        </div>
      )}
    </section>
  );
}
