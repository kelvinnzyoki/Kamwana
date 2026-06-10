'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const CATEGORY_META: Record<string, { emoji: string; description: string }> = {
  tops:        { emoji: '👕', description: 'T-shirts, blouses, shirts & more' },
  dresses:     { emoji: '👗', description: 'Casual, formal and occasion dresses' },
  bottoms:     { emoji: '👖', description: 'Trousers, jeans, skirts & shorts' },
  jackets:     { emoji: '🧥', description: 'Jackets, coats & outerwear' },
  accessories: { emoji: '👜', description: 'Bags, belts, scarves & jewellery' },
  formal:      { emoji: '👔', description: 'Office and occasion wear' },
  casual:      { emoji: '🩴', description: 'Everyday relaxed styles' },
  new:         { emoji: '✨', description: 'Just landed this week' },
  sale:        { emoji: '🏷️', description: 'Up to 50% off selected items' },
};

function fallbackMeta(category: string) {
  return {
    emoji: '🛍️',
    description: `Browse all ${category.toLowerCase()} items`,
  };
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function CategoriesPage() {
  // Fetch products to derive unique categories dynamically
  const { data, isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.products(),
    staleTime: 5 * 60 * 1000,
  });

  const products: any[] = data?.data?.products ?? [];

  // Get unique categories from the product list
  const categories: string[] = products.length > 0
    ? [...new Set(products.map((p: any) => p.category as string).filter(Boolean))]
    : Object.keys(CATEGORY_META);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 h-9 w-48 animate-pulse rounded-xl bg-border" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <p className="mt-1 text-sm opacity-50">Browse by what you're looking for</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categories.map((category) => {
          const meta = CATEGORY_META[category.toLowerCase()] ?? fallbackMeta(category);
          const count = products.filter((p: any) =>
            p.category?.toLowerCase() === category.toLowerCase()
          ).length;

          return (
            <a
              key={category}
              href={`/shop?category=${encodeURIComponent(category)}`}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="text-3xl mb-3">{meta.emoji}</span>
              <div>
                <p className="font-semibold group-hover:text-primary transition-colors">
                  {toTitleCase(category)}
                </p>
                <p className="text-xs opacity-50 mt-0.5 line-clamp-1">
                  {meta.description}
                </p>
                {count > 0 && (
                  <p className="text-xs font-medium text-primary mt-1">
                    {count} item{count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </a>
          );
        })}

        {/* View all card */}
        <a
          href="/shop"
          className="group flex flex-col justify-between rounded-2xl border border-dashed border-border p-5 hover:border-primary transition-colors"
        >
          <span className="text-3xl mb-3">🔍</span>
          <div>
            <p className="font-semibold group-hover:text-primary transition-colors">
              View all
            </p>
            <p className="text-xs opacity-50 mt-0.5">Browse the full collection</p>
          </div>
        </a>
      </div>
    </main>
  );
}
