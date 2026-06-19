'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number) {
  return `KES ${Math.round(n).toLocaleString('en-KE')}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'amber' | 'red' | 'default';
}) {
  const accentClass =
    accent === 'green' ? 'text-green-600 dark:text-green-400' :
    accent === 'amber' ? 'text-amber-600 dark:text-amber-400' :
    accent === 'red'   ? 'text-red-600 dark:text-red-400' :
    '';

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium opacity-50 mb-1.5">{label}</p>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs opacity-40 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Sales chart — dependency-free SVG bar chart ───────────────────────────────

function SalesChart({ series }: { series: { date: string; revenue: number }[] }) {
  const max = Math.max(...series.map((d) => d.revenue), 1);
  const width = 100 / series.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold">Sales — last 30 days</p>
        <p className="text-xs opacity-40">
          Peak: {money(max)}
        </p>
      </div>

      <div className="flex items-end gap-[2px] h-40">
        {series.map((d, i) => {
          const heightPct = max > 0 ? (d.revenue / max) * 100 : 0;
          const isToday = i === series.length - 1;
          return (
            <div
              key={d.date}
              className="group relative flex-1 flex flex-col justify-end"
              style={{ width: `${width}%` }}
            >
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isToday ? 'bg-primary' : 'bg-primary/30 hover:bg-primary/50'
                }`}
                style={{ height: `${Math.max(heightPct, d.revenue > 0 ? 3 : 0)}%` }}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap rounded-lg bg-foreground text-background text-[10px] px-2 py-1 z-10">
                {shortDate(d.date)} · {money(d.revenue)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-[10px] opacity-30">
        <span>{shortDate(series[0]?.date)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
    refetchInterval: 60_000, // auto-refresh every minute for a "live" feel
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl bg-border" />)}
        </div>
        <div className="h-56 rounded-2xl bg-border" />
        <div className="h-64 rounded-2xl bg-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="font-semibold text-red-700 dark:text-red-400">Couldn't load dashboard</p>
        <p className="text-sm opacity-60 mt-1">Refresh the page or check your connection.</p>
      </div>
    );
  }

  const stats = data.data;

  return (
    <div className="space-y-6">

      {/* ── Top stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total revenue"
          value={money(stats.revenue.total)}
          sub={`${money(stats.revenue.today)} today`}
          accent="green"
        />
        <StatCard
          label="Total orders"
          value={String(stats.orders.total)}
          sub={`${stats.orders.paidLast30Days} paid in 30 days`}
        />
        <StatCard
          label="Awaiting payment"
          value={String(stats.orders.pending)}
          sub="Will auto-cancel after 30 min"
          accent={stats.orders.pending > 0 ? 'amber' : 'default'}
        />
        <StatCard
          label="Customers"
          value={String(stats.customers.total)}
          sub={`+${stats.customers.newLast30Days} this month`}
        />
      </div>

      {/* ── Sales chart ───────────────────────────────────────────────────── */}
      <SalesChart series={stats.salesSeries} />

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Recent orders ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="font-semibold text-sm">Recent orders</p>
            <a href="/admin/orders" className="text-xs text-primary underline">View all</a>
          </div>
          <div className="divide-y divide-border">
            {stats.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm opacity-40">No orders yet</p>
            ) : (
              stats.recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{o.customerName}</p>
                    <p className="text-xs opacity-40">
                      #{o.orderNumber} · {o.itemCount} item{o.itemCount !== 1 ? 's' : ''} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-sm font-semibold">{money(o.total)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[o.status] ?? ''}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Low stock + top products ────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Low stock alert */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-semibold text-sm">Low stock</p>
              {stats.inventory.outOfStockCount > 0 && (
                <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                  {stats.inventory.outOfStockCount} out of stock
                </span>
              )}
            </div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {stats.inventory.lowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm opacity-40">All stocked up</p>
              ) : (
                stats.inventory.lowStock.map((p: any) => (
                  <a
                    key={p.id}
                    href={`/admin/products?edit=${p.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    {p.image && (
                      <img src={p.image} alt={p.name} className="h-9 w-9 rounded-lg object-cover bg-muted shrink-0" />
                    )}
                    <p className="flex-1 text-sm truncate">{p.name}</p>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                      {p.stock} left
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-sm">Top products</p>
            </div>
            <div className="divide-y divide-border">
              {stats.topProducts.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm opacity-40">No sales yet</p>
              ) : (
                stats.topProducts.map((p: any, i: number) => (
                  <div key={p.productId} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xs font-bold opacity-30 w-4">{i + 1}</span>
                    {p.image && (
                      <img src={p.image} alt={p.name} className="h-9 w-9 rounded-lg object-cover bg-muted shrink-0" />
                    )}
                    <p className="flex-1 text-sm truncate">{p.name}</p>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold">{p.unitsSold} sold</p>
                      <p className="text-[10px] opacity-40">{money(p.revenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
