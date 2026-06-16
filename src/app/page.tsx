import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import type { Product } from '@/types';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await apiFetch<{ data: { products: Product[] } }>(
      '/api/products?featured=true&limit=8'
    );
    return response.data.products || [];
  } catch (error) {
    console.error('Failed to load featured products:', error);
    return [];
  }
}

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
          Clasic Closet
        </p>

        <h1 className="mx-auto max-w-4xl text-4xl font-semibold md:text-6xl">
          Premium fashion, smooth shopping, secure checkout.
        </h1>

        {/* FIX: was text-muted-foreground (not in Tailwind config) → opacity-60 */}
        <p className="mx-auto mt-6 max-w-2xl opacity-60">
          Discover curated clothing pieces and shop safely with M-Pesa or
          Card.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            // FIX: was text-primary-foreground (hyphenated, not in config) → text-primaryForeground
            className="rounded-full bg-primary px-8 py-3 font-medium text-primaryForeground hover:opacity-90 transition-opacity"
          >
            Shop Collection
          </Link>
          <Link
            href="/categories"
            className="rounded-full border border-border px-8 py-3 font-medium hover:bg-muted transition-colors"
          >
            Browse Categories
          </Link>
        </div>
      </section>

      {/* ── Featured products ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Products</h2>
          <Link href="/shop" className="text-sm text-primary hover:opacity-80">
            View all →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center opacity-60">
            Products are loading soon. Please check back shortly.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card hover:shadow-soft transition-shadow"
              >
                {/* FIX: was <img> (no optimisation) → next/image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="mt-1 text-sm opacity-60">
                    KES {Number(product.price).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Value props ───────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-3">
          {[
            { icon: '📱', title: 'M-Pesa & Card', body: 'Pay with M-Pesa or Paystack — whichever suits you.' },
            { icon: '🚚', title: 'Free Shipping', body: 'Complimentary delivery on every order, Kenya-wide.' },
            { icon: '✦', title: 'Quality Pieces', body: 'Curated styles chosen to fit the Kenyan body and budget.' },
          ].map((v) => (
            <div key={v.title} className="text-center space-y-2">
              <p className="text-3xl">{v.icon}</p>
              <p className="font-semibold">{v.title}</p>
              <p className="text-sm opacity-60">{v.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
