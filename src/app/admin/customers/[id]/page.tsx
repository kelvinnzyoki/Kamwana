'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number) {
  return `KES ${Math.round(n).toLocaleString('en-KE')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
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

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'text-green-600 dark:text-green-400',
  PENDING:   'text-yellow-600 dark:text-yellow-400',
  FAILED:    'text-red-600 dark:text-red-400',
  REFUNDED:  'text-gray-500',
};

// ─── Order card — full billing/payment detail ──────────────────────────────────

function OrderHistoryCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold">#{order.orderNumber}</p>
          <p className="text-xs opacity-50">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          <span className="font-bold text-sm">{money(Number(order.total))}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[order.status] ?? ''}`}>
            {order.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4 text-sm">

          {/* Line items */}
          <div className="space-y-1.5">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between opacity-80">
                <span>{item.productName}{item.size ? ` (${item.size})` : ''} × {item.quantity}</span>
                <span className="font-medium">{money(Number(item.total))}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
              <span>Total</span>
              <span>{money(Number(order.total))}</span>
            </div>
          </div>

          {/* Billing / payment detail */}
          <div className="rounded-xl bg-muted/40 p-3.5 space-y-1 text-xs">
            <p className="font-semibold text-foreground mb-1.5">Payment</p>
            <p>Method: <span className="font-medium text-foreground">
              {order.paymentMethod === 'MPESA' ? 'M-Pesa' :
               order.paymentMethod === 'PAYSTACK' ? 'Card (Paystack)' :
               order.paymentMethod}
            </span></p>
            {order.payment ? (
              <>
                <p>Status: <span className={`font-medium ${PAYMENT_STATUS_STYLES[order.payment.status] ?? ''}`}>
                  {order.payment.status}
                </span></p>
                {order.payment.transactionRef && (
                  <p>Reference: <span className="font-mono">{order.payment.transactionRef}</span></p>
                )}
                {order.payment.phoneNumber && (
                  <p>M-Pesa number: <span className="font-medium text-foreground">{order.payment.phoneNumber}</span></p>
                )}
                {order.payment.paidAt && (
                  <p>Paid: {formatDateTime(order.payment.paidAt)}</p>
                )}
                {order.payment.failureReason && (
                  <p className="text-red-600">Failure reason: {order.payment.failureReason}</p>
                )}
              </>
            ) : (
              <p className="opacity-50">No payment record</p>
            )}
          </div>

          {/* Shipping address used for THIS order */}
          {order.shippingAddress && (
            <div className="rounded-xl bg-muted/40 p-3.5 space-y-0.5 text-xs">
              <p className="font-semibold text-foreground mb-1.5">Shipped to</p>
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address1}{order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''}</p>
              <p>{order.shippingAddress.city}{order.shippingAddress.county ? `, ${order.shippingAddress.county}` : ''}</p>
              <p>{order.shippingAddress.phone}</p>
              {order.shippingAddress.email && <p>{order.shippingAddress.email}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => adminApi.customer(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-border" />
        <div className="h-32 rounded-2xl bg-border" />
        <div className="h-64 rounded-2xl bg-border" />
      </div>
    );
  }

  if (error || !data?.data?.customer) {
    return (
      <div className="rounded-2xl border border-border p-12 text-center">
        <p className="opacity-50 mb-4">Customer not found</p>
        <Link href="/admin/customers" className="text-primary underline text-sm">← Back to customers</Link>
      </div>
    );
  }

  const { customer, orders, summary } = data.data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/customers" className="text-xs text-primary underline mb-2 inline-block">
          ← All customers
        </Link>
        <h1 className="text-2xl font-bold">{customer.name}</h1>
      </div>

      {/* ── Contact + summary ─────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
          <p className="text-xs font-semibold opacity-50 mb-1">Contact</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-60 w-16 shrink-0">Email</span>
            <span className="font-medium">{customer.email ?? '—'}</span>
            {customer.email && (
              <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                customer.emailVerified
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {customer.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-60 w-16 shrink-0">Phone</span>
            <span className="font-medium">{customer.phone ?? '—'}</span>
            {customer.phone && (
              <span className={`text-[10px] rounded-full px-2 py-0.5 ${
                customer.phoneVerified
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {customer.phoneVerified ? 'Verified' : 'Unverified'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-60 w-16 shrink-0">Joined</span>
            <span className="font-medium">{formatDate(customer.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-60 w-16 shrink-0">Role</span>
            <span className="font-medium">{customer.role}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5">
          <p className="text-xs font-semibold opacity-50 mb-1">Lifetime summary</p>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Total spent</span>
            <span className="font-bold">{money(summary.totalSpent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Paid orders</span>
            <span className="font-medium">{summary.paidOrders}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-60">Total orders</span>
            <span className="font-medium">{summary.totalOrders}</span>
          </div>
        </div>
      </div>

      {/* ── Saved addresses ────────────────────────────────────────────────── */}
      {customer.addresses?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold opacity-50 mb-3">Saved addresses</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {customer.addresses.map((a: any) => (
              <div key={a.id} className="rounded-xl bg-muted/40 p-3 text-xs space-y-0.5">
                {a.isDefault && (
                  <span className="inline-block mb-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                    Default
                  </span>
                )}
                <p className="font-medium text-foreground">{a.firstName} {a.lastName}</p>
                <p>{a.address1}{a.address2 ? `, ${a.address2}` : ''}</p>
                <p>{a.city}{a.county ? `, ${a.county}` : ''}</p>
                <p>{a.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Order history ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold mb-3">Order history</p>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border p-10 text-center opacity-50 text-sm">
            No orders yet
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <OrderHistoryCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
