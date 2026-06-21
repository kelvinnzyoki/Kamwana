'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Overview',  href: '/admin',           icon: '📊' },
  { label: 'Orders',    href: '/admin/orders',     icon: '📦' },
  { label: 'Products',  href: '/admin/products',   icon: '👕' },
  { label: 'Customers', href: '/admin/customers',  icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ── Role gate ────────────────────────────────────────────────────────────────
  // This is a UX convenience, NOT the real security boundary — every
  // /api/admin/* route is independently protected server-side by
  // requireAuth + requireAdmin (see admin.routes.ts). A non-admin who
  // somehow lands on this page would just see empty/error states because
  // every API call would 403. This redirect just avoids that confusing
  // experience and sends them somewhere sensible immediately.
  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
  });

  const user = meData?.data?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      window.location.href = user ? '/' : '/login?next=/admin';
    }
  }, [isLoading, isAdmin, user]);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl flex">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-background min-h-screen sticky top-0">
          <div className="px-5 py-5 border-b border-border">
            <p className="font-bold text-lg">ClasicCloset</p>
            <p className="text-xs opacity-40">Admin Dashboard</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primaryForeground' : 'hover:bg-muted'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-5 py-4 border-t border-border">
            <Link href="/" className="text-xs opacity-50 hover:opacity-80">← Back to shop</Link>
          </div>
        </aside>

        {/* ── Mobile top nav ─────────────────────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
          <nav className="flex">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
                    active ? 'text-primary' : 'opacity-50'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
