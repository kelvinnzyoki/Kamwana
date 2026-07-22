'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// FIX: added the actual product categories from the seed data (Apparel, Footwear).
// The original map only had lowercase generic keys that never matched the real data,
// so every category fell through to the generic fallback emoji.
// Keys are lowercase because the lookup uses category.toLowerCase().
const CATEGORY_META: Record<string, { emoji: string; description: string }> = {
  // ── Actual seeded categories ───────────────────────────────────────────────
  apparel: {
    emoji: '👕',
    description: 'T-shirts, polos, joggers, cargo pants and more',
  },
  footwear: {
    emoji: '👟',
    description: 'Sneakers, boots, loafers, sandals and dress shoes',
  },
  // ── Additional categories (for future products) ────────────────────────────
  tops: { emoji: '👔', description: 'Shirts, blouses and casual tops' },
  dresses: { emoji: '👗', description: 'Casual, formal and occasion dresses' },
  bottoms: { emoji: '👖', description: 'Trousers, jeans, skirts and shorts' },
  jackets: { emoji: '🧥', description: 'Jackets, coats and outerwear' },
  accessories: {
    emoji: '👜',
    description: 'Bags, belts, scarves and jewellery',
  },
  formal: { emoji: '🎩', description: 'Office and occasion wear' },
  casual: { emoji: '🩴', description: 'Everyday relaxed styles' },
};

function fallbackMeta(category: string) {
  return {
    emoji: '🛍️',
    description: `Browse all ${category.toLowerCase()} items`,
  };
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function CategoriesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products-categories'],
    queryFn: () => api.products('?limit=60'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const products: any[] = data?.data?.products ?? [];

  // Derive unique categories from live product data, fall back to known keys.
  const categories: string[] =
    products.length > 0
      ? Array.from(
          new Set(
            products
              .map((p: any) => p.category as string)
              .filter(Boolean)
          )
        )
      : Object.keys(CATEGORY_META).filter((k) =>
          ['apparel', 'footwear'].includes(k)
        );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 h-9 w-48 animate-pulse rounded-xl bg-border" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="mt-1 text-sm opacity-50">
          Browse by what you are looking for
        </p>

        {isError && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Could not load live categories. Showing defaults.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {categories.map((category) => {
          // FIX: lookup is now lowercase-aware so 'Apparel' → meta['apparel'] works.
          const meta =
            CATEGORY_META[category.toLowerCase()] ?? fallbackMeta(category);

          const count = products.filter(
            (p: any) =>
              (p.category as string)?.toLowerCase() ===
              category.toLowerCase()
          ).length;

          return (
            <Link
              key={category}
              href={`/shop?category=${encodeURIComponent(category)}`}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary hover:bg-primary/5"
            >
              <span className="mb-3 text-3xl">{meta.emoji}</span>

              <div>
                <p className="font-semibold transition-colors group-hover:text-primary">
                  {toTitleCase(category)}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs opacity-50">
                  {meta.description}
                </p>
                {count > 0 && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {count} item{count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </Link>
          );
        })}

        {/* View all */}
        <Link
          href="/shop"
          className="group flex flex-col justify-between rounded-2xl border border-dashed border-border p-5 transition-colors hover:border-primary"
        >
          <span className="mb-3 text-3xl">🔍</span>
          <div>
            <p className="font-semibold transition-colors group-hover:text-primary">
              View all
            </p>
            <p className="mt-0.5 text-xs opacity-50">
              Browse the full collection
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
