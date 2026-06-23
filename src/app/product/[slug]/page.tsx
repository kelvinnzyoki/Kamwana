import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { AddToCart } from './ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  images?: string[];
  category: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  isActive: boolean;
  featured?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number) {
  return `KES ${Math.round(Number(n)).toLocaleString('en-KE')}`;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await api.product(slug);
    return res?.data?.product ?? null;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Product not found — ClasicCloset' };
  return {
    title: `${p.name} — ClasicCloset`,
    description: p.description?.slice(0, 160),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// Lives at: src/app/product/[slug]/page.tsx
// Sibling file required in the SAME folder: src/app/product/[slug]/ui.tsx
// (exports AddToCart — the fixed version that renders sizes dynamically
// from the product's own `sizes` array, not a hardcoded clothing list)

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProduct(slug);

  if (!p || !p.isActive) notFound();

  const inStock = p.stock > 0;
  const onSale = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
  const gallery = p.images?.length ? p.images : [p.image];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">

        {/* ── Gallery ───────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
            <img
              src={gallery[0]}
              alt={p.name}
              className="h-full w-full object-cover"
            />
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(1, 5).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl bg-muted">
                  <img src={img} alt={`${p.name} ${i + 2}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-40 mb-1.5">
              {p.category}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{p.name}</h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-bold">{money(p.price)}</span>
            {onSale && (
              <span className="text-base line-through opacity-40">
                {money(p.compareAtPrice!)}
              </span>
            )}
            {onSale && (
              <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                Sale
              </span>
            )}
          </div>

          {/* Stock status */}
          {inStock ? (
            p.stock <= 5 ? (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ⚠ Only {p.stock} left in stock — order soon
              </p>
            ) : (
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                ✓ {p.stock} in stock
              </p>
            )
          ) : (
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Out of stock
            </p>
          )}

          {/* Description */}
          <p className="text-sm leading-relaxed opacity-70">{p.description}</p>

          {/* Colors (display only — no selection logic unless your cart supports it) */}
          {p.colors?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold opacity-70">Color</p>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((color) => (
                  <span
                    key={color}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart — sizes rendered dynamically from p.sizes,
              works correctly for both clothing (S/M/L) and shoes (39/40/41)
              since AddToCart no longer hardcodes a clothing-only list */}
          {inStock ? (
            <AddToCart productId={p.id} sizes={p.sizes ?? []} />
          ) : (
            <button
              disabled
              className="rounded-full bg-muted px-8 py-3 font-bold opacity-50 cursor-not-allowed"
            >
              Out of stock
            </button>
          )}

          {/* Trust signals */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2 text-xs opacity-50">
            <span>✓ Free shipping</span>
            <span>✓ M-Pesa & card accepted</span>
            <span>✓ Pay on checkout — browse freely as a guest</span>
          </div>
        </div>
      </div>
    </main>
  );
}
