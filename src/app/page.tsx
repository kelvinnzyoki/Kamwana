import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";

async function getFeaturedProducts() {
  try {
    const response = await apiFetch<{ data: { products: Product[] } }>(
      "/api/products?featured=true&limit=8"
    );

    return response.data.products || [];
  } catch (error) {
    console.error("Failed to load featured products:", error);
    return [];
  }
}

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <main>
      <section className="px-4 py-20 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
          Classic Closet
        </p>

        <h1 className="mx-auto max-w-4xl text-4xl font-semibold md:text-6xl">
          Premium fashion, smooth shopping, secure checkout.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
          Discover curated clothing pieces and shop safely with M-Pesa or
          Paystack.
        </p>

        <div className="mt-8">
          <Link
            href="/shop"
            className="rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground"
          >
            Shop Collection
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Products</h2>
          <Link href="/shop" className="text-sm text-primary">
            View all
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            Products are loading soon. Please check back shortly.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />

                <h3 className="mt-4 font-medium">{product.name}</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  KES {Number(product.price).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
