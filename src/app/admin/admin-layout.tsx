'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Overview',  href: '/admin',          icon: '📊' },
  { label: 'Orders',    href: '/admin/orders',    icon: '📦' },
  { label: 'Products',  href: '/admin/products',  icon: '👕' },
  { label: 'Customers', href: '/admin/customers', icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Admin nav strip ────────────────────────────────────────────────────
          Sits directly below the shop navbar (which the root layout renders).
          Always visible on all screen sizes — no fixed-bottom approach which
          was being hidden by the browser's own navigation bar on Android.
          Desktop gets a wider pill-style horizontal nav; mobile gets a full-
          width strip of equal-sized tabs. ───────────────────────────────── */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-7xl">
          {/* Mobile: full-width equal tabs */}
          <nav className="flex md:hidden">
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors border-b-2 ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop: pill-style horizontal nav with back-to-shop link */}
          <div className="hidden md:flex items-center gap-1 px-4 py-2">
            <span className="text-xs font-bold opacity-40 mr-2 tracking-wider uppercase">
              Admin
            </span>
            {NAV_ITEMS.map((item) => {
              const active = item.href === '/admin'
                ? pathname === '/admin'
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primaryForeground'
                      : 'hover:bg-muted opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="ml-auto text-xs opacity-40 hover:opacity-70 transition-opacity"
            >
              ← Back to shop
            </Link>
          </div>
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
