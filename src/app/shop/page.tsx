'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product-card';

const LIMIT = 12;

// ─── ShopContent ──────────────────────────────────────────────────────────────
// Wrapped in Suspense below because useSearchParams() requires it.

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get('category') || '';
  const currentQ = searchParams.get('q') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [searchInput, setSearchInput] = useState(currentQ);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { q: currentQ, category, page }],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (currentQ) qs.set('q', currentQ);
      if (category) qs.set('category', category);
      qs.set('page', String(page));
      qs.set('limit', String(LIMIT));
      return api.products(`?${qs}`);
    },
    staleTime: 30_000,
  });

  const products: any[] = data?.data?.products ?? [];
  const total: number = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function buildHref(p: number) {
    const sp = new URLSearchParams();
    if (currentQ) sp.set('q', currentQ);
    if (category) sp.set('category', category);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return `/shop${s ? `?${s}` : ''}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (searchInput.trim()) sp.set('q', searchInput.trim());
    if (category) sp.set('category', category);
    router.push(`/shop?${sp}`);
  }

  function handleClear() {
    setSearchInput('');
    router.push('/shop');
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold">
          {category || 'Shop Collection'}
        </h1>
        {!isLoading && (
          <p className="mt-1 text-sm opacity-50">
            {total} product{total !== 1 ? 's' : ''}
            {currentQ && ` matching "${currentQ}"`}
          </p>
        )}
      </div>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products, colours, sizes…"
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {(searchInput || currentQ || category) && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}

        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primaryForeground hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {/* ── Loading skeletons ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] animate-pulse rounded-3xl bg-border"
            />
          ))}
        </div>
      )}

      {/* ── Products grid ──────────────────────────────────────────────────── */}
      {!isLoading && products.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p: any) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!isLoading && products.length === 0 && (
        <div className="rounded-2xl border border-border p-16 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="opacity-60 mb-4 text-sm">
            Try a different search term or browse all categories.
          </p>
          <Link href="/shop" className="text-primary underline">
            Clear filters
          </Link>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={buildHref(page - 1)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              ← Previous
            </Link>
          )}

          <span className="text-sm opacity-60">
            Page {page} of {totalPages}
          </span>

          {page < totalPages && (
            <Link
              href={buildHref(page + 1)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40 pointer-events-none"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-6 h-10 w-64 animate-pulse rounded-xl bg-border" />
          <div className="mb-8 h-12 animate-pulse rounded-full bg-border" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-border" />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
  }
