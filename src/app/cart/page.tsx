'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';

function money(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

export default function CartPage() {
  const queryClient = useQueryClient();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: api.cart,
    retry: false,
  });

  // ── Remove item ─────────────────────────────────────────────────────────────
  // Uses item.id (the CartItem primary key), NOT item.productId.
  // Passing productId was likely the bug — the DELETE /api/cart/items/:id
  // endpoint expects the cart item's own ID.
  const remove = useMutation({
    mutationFn: (cartItemId: string) => api.removeCart(cartItemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  // ── Update quantity ─────────────────────────────────────────────────────────
  const updateQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.updateCart(id, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const items: any[] = cartData?.data?.cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-xl bg-border" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-border" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛍️</p>
        <h1 className="text-2xl font-bold mb-2">Your bag is empty</h1>
        <p className="opacity-60 mb-6 text-sm">Add items from the shop to get started.</p>
        <a href="/shop"
          className="rounded-full bg-primary px-6 py-3 font-bold text-primaryForeground">
          Browse shop
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">
        Your bag{' '}
        <span className="text-base font-normal opacity-40">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </h1>

      <div className="space-y-3 mb-6">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            {/* Product image */}
            {(item.product?.image || item.productImage) && (
              <img
                src={item.product?.image || item.productImage}
                alt={item.product?.name || item.productName || 'Product'}
                className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"
              />
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {item.product?.name || item.productName || 'Product'}
              </p>
              <p className="text-sm opacity-60">{money(Number(item.price))}</p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-background">
              <button
                onClick={() => {
                  if (item.quantity > 1) {
                    updateQty.mutate({ id: item.id, quantity: item.quantity - 1 });
                  } else {
                    remove.mutate(item.id);
                  }
                }}
                disabled={remove.isPending || updateQty.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-l-xl hover:bg-muted transition-colors disabled:opacity-40 text-lg leading-none"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })
                }
                disabled={updateQty.isPending}
                className="flex h-8 w-8 items-center justify-center rounded-r-xl hover:bg-muted transition-colors disabled:opacity-40 text-lg leading-none"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Line total */}
            <p className="text-sm font-bold w-20 text-right shrink-0">
              {money(Number(item.price) * item.quantity)}
            </p>

            {/* Remove */}
            <button
              onClick={() => remove.mutate(item.id)}
              disabled={remove.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 text-foreground/30 transition-colors disabled:opacity-40 shrink-0"
              aria-label="Remove item"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex justify-between text-sm opacity-60">
          <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm opacity-60">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-border pt-3">
          <span>Total</span>
          <span>{money(subtotal)}</span>
        </div>

        {/* Checkout — works for guests and logged-in users.
            The checkout page itself requires auth and handles the redirect. */}
        <a
          href="/checkout"
          className="mt-1 flex w-full items-center justify-center rounded-full bg-primary py-3 font-bold text-primaryForeground hover:opacity-90 transition-opacity"
        >
          Checkout
        </a>

        <a
          href="/shop"
          className="flex w-full items-center justify-center rounded-full border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Continue shopping
        </a>
      </div>
    </main>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
