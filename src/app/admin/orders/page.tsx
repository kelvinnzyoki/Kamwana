'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { ApiRequestError } from '@/lib/api';

function money(n: number) {
  return `KES ${Math.round(n).toLocaleString('en-KE')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID:       'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  SHIPPED:    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERED:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function OrderRow({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: (status: string) => adminApi.updateOrderStatus(order.id, status),
    onSuccess: (res: any, status) => {
      setError('');

      const warning = res?.data?.deliveredEmailWarning;
      const deliveredEmailSent = res?.data?.deliveredEmailSent;

      if (status === 'DELIVERED') {
        if (deliveredEmailSent) {
          setNotice('Delivered email and PDF receipt sent to the customer.');
        } else if (warning) {
          setNotice(`Order marked delivered, but email was not sent: ${warning}`);
        } else {
          setNotice('Order marked delivered.');
        }
      } else {
        setNotice('Order status updated.');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setTimeout(() => setNotice(''), 6000);
    },
    onError: (err) => {
      setNotice('');
      setError(err instanceof ApiRequestError ? err.message : 'Update failed');
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold">#{order.orderNumber}</p>
          <p className="text-xs opacity-50 truncate">
            {order.user?.name} · {order.user?.email || order.user?.phone} · {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="font-bold text-sm">{money(Number(order.total))}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] ?? ''}`}>
            {order.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Items */}
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="opacity-70">
                  {item.productName}{item.size ? ` (${item.size})` : ''} × {item.quantity}
                </span>
                <span className="font-medium">{money(Number(item.total))}</span>
              </div>
            ))}
          </div>

          {/* Shipping */}
          {order.shippingAddress && (
            <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-0.5 opacity-70">
              <p className="font-medium opacity-100">Shipping to</p>
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address1}, {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.phone}</p>
            </div>
          )}

          {/* Payment */}
          {order.payment && (
            <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-0.5 opacity-70">
              <p>Method: <span className="font-medium opacity-100">{order.paymentMethod}</span></p>
              <p>Payment status: <span className="font-medium opacity-100">{order.payment.status}</span></p>
              {order.payment.transactionRef && (
                <p>Ref: <span className="font-mono">{order.payment.transactionRef}</span></p>
              )}
            </div>
          )}

          {/* Status update */}
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1.5">Update status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  disabled={updateStatus.isPending || s === order.status}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    s === order.status
                      ? `${STATUS_STYLES[s]} ring-2 ring-offset-1 ring-primary`
                      : 'border border-border opacity-60 hover:opacity-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {notice && <p className="text-xs text-green-700 dark:text-green-400 mt-2">{notice}</p>}
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, search, page],
    queryFn: () => adminApi.orders({ status, search, page }),
  });

  const orders: any[] = data?.data?.orders ?? [];
  const totalPages: number = data?.data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order #, name, email…"
          className="flex-1 min-w-[200px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-border animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border p-12 text-center opacity-50">
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm opacity-50">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
