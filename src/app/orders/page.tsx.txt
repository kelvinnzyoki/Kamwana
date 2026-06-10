'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }),
  };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  PAID:       'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-orange-100 text-orange-800',
  SHIPPED:    'bg-purple-100 text-purple-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
  REFUNDED:   'bg-gray-100 text-gray-600',
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

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const { date, time } = formatDate(order.createdAt);
  const style = STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600';
  const label = STATUS_LABELS[order.status] ?? order.status;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-sm tracking-wide">
              Order #{order.orderNumber}
            </p>
            <p className="text-xs opacity-50">
              {date} &middot; {time}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
              {label}
            </span>
            <span className="font-bold text-sm">{money(Number(order.total))}</span>
            <ChevronIcon open={expanded} />
          </div>
        </div>

        {/* Item count summary when collapsed */}
        {!expanded && (
          <p className="mt-2 text-xs opacity-50">
            {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
            {order.paymentMethod && ` · ${order.paymentMethod === 'MPESA' ? 'M-Pesa' : order.paymentMethod === 'PAYSTACK' ? 'Card' : order.paymentMethod}`}
          </p>
        )}
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
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
                    Qty {item.quantity} &middot; {money(Number(item.price))} each
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
          {order.payment && (
            <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs space-y-1 text-foreground/60">
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
  });

  const orders: any[] = data?.data?.orders ?? [];

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
        <p className="opacity-60 mb-6">Your order history is saved to your account.</p>
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
          {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? 's' : ''}` : ''}
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
      strokeLinecap="round" className={`w-4 h-4 shrink-0 transition-transform opacity-40 ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
