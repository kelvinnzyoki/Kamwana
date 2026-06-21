'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';

function money(n: number) {
  return `KES ${Number(n).toLocaleString('en-KE')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => adminApi.customers({ search, page }),
  });

  const customers: any[] = data?.data?.customers ?? [];
  const totalPages: number = data?.data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Customers</h1>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name, email, or phone…"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-border animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-border p-12 text-center opacity-50">No customers found</div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="divide-y divide-border">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/admin/customers/${c.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primaryForeground">
                  {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {c.emailVerified && <span title="Email verified" className="text-xs">✓📧</span>}
                    {c.phoneVerified && <span title="Phone verified" className="text-xs">✓📱</span>}
                  </div>
                  <p className="text-xs opacity-50 truncate">
                    {c.email?.endsWith('@phone.classic-closet.local') ? c.phone : c.email}
                    {' · joined '}{formatDate(c.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{money(c.totalSpent)}</p>
                  <p className="text-xs opacity-50">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-30">Previous</button>
          <span className="text-sm opacity-50">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
