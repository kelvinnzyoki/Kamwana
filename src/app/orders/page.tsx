'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number) {
  return `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
  };
}

/** Minutes elapsed since an ISO timestamp */
function minutesAgo(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 60_000;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID:       'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  SHIPPED:    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Awaiting payment',
  PAID:       'Paid',
  PROCESSING: 'Processing',
  SHIPPED:    'Shipped',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
  REFUNDED:   'Refunded',
};

// ─── Resume-payment panel ──────────────────────────────────────────────────────
// Shown inline inside a PENDING order card. Lets the user complete payment
// for the existing order without having to go through checkout again.

function ResumePaymentPanel({ order, onDone }: { order: any; onDone: () => void }) {
  const method: string = order.paymentMethod;

  // Pre-fill M-Pesa phone from the payment record (stored at checkout) or
  // from the shipping address phone as fallback.
  const defaultPhone =
    order.payment?.phoneNumber ||
    order.shippingAddress?.phone ||
    '';

  const [mpesaPhone, setMpesaPhone] = useState(defaultPhone);
  const [mpesaSuccess, setMpesaSuccess] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const payPaystack = useMutation({
    mutationFn: () => api.paystack(order.id),
    onSuccess: (r) => {
      const url = r.data?.authorizationUrl ?? r.data?.authorization_url;
      if (url) window.location.href = url;
      else setError('No payment URL returned. Try again.');
    },
    onError: (err) =>
      setError(err instanceof ApiRequestError ? err.message : 'Payment failed. Try again.'),
  });

  const payMpesa = useMutation({
    mutationFn: () => api.mpesa(order.id, mpesaPhone),
    onSuccess: () => {
      setMpesaSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) =>
      setError(err instanceof ApiRequestError ? err.message : 'M-Pesa request failed. Try again.'),
  });

  if (mpesaSuccess) {
    return (
      <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
        <p className="font-semibold mb-1">📱 Check your phone</p>
        <p className="text-sm opacity-70">
          An M-Pesa prompt was sent to <strong>{mpesaPhone}</strong>. Enter your PIN to complete payment.
        </p>
        <button onClick={onDone} className="mt-3 text-xs underline opacity-50">Dismiss</button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <p className="text-sm font-semibold">Complete your payment</p>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-600">
          {error}
        </p>
      )}

      {method === 'PAYSTACK' && (
        <button
          onClick={() => { setError(''); payPaystack.mutate(); }}
          disabled={payPaystack.isPending}
          className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primaryForeground disabled:opacity-50"
        >
          {payPaystack.isPending ? 'Redirecting…' : '💳 Pay with card'}
        </button>
      )}

      {method === 'MPESA' && (
        <>
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-60">M-Pesa number</label>
            <input
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => { setError(''); payMpesa.mutate(); }}
            disabled={payMpesa.isPending || !mpesaPhone.trim()}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primaryForeground disabled:opacity-50"
          >
            {payMpesa.isPending ? 'Sending prompt…' : '📱 Send M-Pesa STK push'}
          </button>
        </>
      )}

      {method === 'CASH_ON_DELIVERY' && (
        <p className="text-sm opacity-60">Pay on delivery — no action needed.</p>
      )}

      <button onClick={onDone} className="w-full text-xs opacity-40 hover:opacity-60 pt-1">
        Cancel
      </button>
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const [resuming, setResuming] = useState(false);

  const { date, time } = formatDate(order.createdAt);
  const style = STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600';
  const label = STATUS_LABELS[order.status] ?? order.status;

  // A PENDING order is resumable only if it's under 30 minutes old.
  // After 30 min the backend cleanup (triggered by GET /api/orders/mine)
  // cancels it and releases the reserved stock automatically.
  const isPending   = order.status === 'PENDING';
  const isResumable = isPending && minutesAgo(order.createdAt) < 30;
  const minutesLeft = isResumable
    ? Math.max(0, Math.ceil(30 - minutesAgo(order.createdAt)))
    : 0;

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-colors ${
      isPending ? 'border-yellow-400/50' : 'border-border'
    }`}>

      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-sm tracking-wide">
              Order #{order.orderNumber}
            </p>
            <p className="text-xs opacity-50">{date} · {time}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
              {label}
            </span>
            <span className="font-bold text-sm">{money(Number(order.total))}</span>
            <ChevronIcon open={expanded} />
          </div>
        </div>

        {/* Pending callout strip */}
        {isResumable && !expanded && (
          <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
            ⏳ Payment window closes in ~{minutesLeft} min — tap to continue
          </p>
        )}

        {/* Collapsed summary */}
        {!expanded && !isResumable && (
          <p className="mt-2 text-xs opacity-50">
            {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
            {order.paymentMethod && ` · ${
              order.paymentMethod === 'MPESA' ? 'M-Pesa' :
              order.paymentMethod === 'PAYSTACK' ? 'Card' :
              order.paymentMethod
            }`}
          </p>
        )}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">

          {/* Pending / resumable banner */}
          {isResumable && !resuming && (
            <div className="rounded-xl border border-yellow-400/40 bg-yellow-50/60 dark:bg-yellow-900/20 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
                  Payment not completed
                </p>
                <p className="text-xs text-yellow-700/70 dark:text-yellow-500 mt-0.5">
                  ~{minutesLeft} min left before this order is cancelled and stock is released.
                </p>
              </div>
              <button
                onClick={() => setResuming(true)}
                className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primaryForeground"
              >
                Pay now
              </button>
            </div>
          )}

          {isPending && !isResumable && (
            <div className="rounded-xl border border-red-400/30 bg-red-50/50 dark:bg-red-900/20 p-3">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Payment window expired
              </p>
              <p className="text-xs text-red-600/70 mt-0.5">
                This order will be cancelled and stock released automatically.
              </p>
            </div>
          )}

          {/* Resume payment inline panel */}
          {resuming && (
            <ResumePaymentPanel
              order={order}
              onDone={() => setResuming(false)}
            />
          )}

          {/* Items */}
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-14 w-14 rounded-xl object-cover bg-muted shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs opacity-50">
                    Qty {item.quantity} · {money(Number(item.price))} each
                  </p>
                </div>
                <p className="text-sm font-semibold shrink-0">
                  {money(Number(item.total))}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between opacity-60">
              <span>Subtotal</span>
              <span>{money(Number(order.subtotal))}</span>
            </div>
            {Number(order.shippingCost) > 0 && (
              <div className="flex justify-between opacity-60">
                <span>Shipping</span>
                <span>{money(Number(order.shippingCost))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-border">
              <span>Total</span>
              <span>{money(Number(order.total))}</span>
            </div>
          </div>

          {/* Payment info */}
          {order.payment && order.status !== 'PENDING' && (
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs space-y-1 opacity-60">
              <p>
                Payment:{' '}
                <span className="font-medium text-foreground">
                  {order.paymentMethod === 'MPESA' ? 'M-Pesa' :
                   order.paymentMethod === 'PAYSTACK' ? 'Card (Paystack)' :
                   order.paymentMethod}
                </span>
              </p>
              {order.payment.transactionRef && (
                <p>Ref: <span className="font-mono">{order.payment.transactionRef}</span></p>
              )}
              {order.payment.paidAt && (
                <p>Paid: {formatDate(order.payment.paidAt).date} at {formatDate(order.payment.paidAt).time}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: api.orders,
    retry: false,
    // Refetch on mount so the stale-cleanup on the backend always runs
    // and users see up-to-date statuses without a manual refresh.
    refetchOnMount: true,
  });

  const orders: any[] = data?.data?.orders ?? [];
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-border" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-border" />
        ))}
      </div>
    );
  }

  if (error instanceof ApiRequestError && error.status === 401) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold mb-2">Sign in to view your orders</h1>
        <p className="opacity-60 mb-6 text-sm">Your order history is saved to your account.</p>
        <a href="/login?next=/orders"
          className="rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="mt-1 text-sm opacity-50">
          {orders.length > 0
            ? `${orders.length} order${orders.length !== 1 ? 's' : ''}${pendingCount > 0 ? ` · ${pendingCount} awaiting payment` : ''}`
            : ''}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border p-16 text-center">
          <p className="text-5xl mb-4">🛍️</p>
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="opacity-60 mb-6 text-sm">When you place an order it'll appear here.</p>
          <a href="/shop"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primaryForeground">
            Start shopping
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round"
      className={`w-4 h-4 shrink-0 opacity-40 transition-transform ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
