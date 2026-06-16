"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiRequestError } from "@/lib/api";
import { money } from "@/lib/money";
import type { CartItem } from "@/types";

function getError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return (
      (error.data as any)?.message || error.message || "Something went wrong."
    );
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function CartSkeleton() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 h-12 w-52 animate-pulse rounded-xl bg-border" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-3xl bg-border" />
        ))}
      </div>
    </section>
  );
}

export default function CartPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");

  const cart = useQuery({
    queryKey: ["cart"],
    queryFn: api.cart,
  });

  const items: CartItem[] = cart.data?.data?.cart?.items ?? [];

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const updateCart = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      api.updateCart(id, quantity),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => showNotice(getError(error)),
  });

  const removeCart = useMutation({
    mutationFn: (id: string) => api.removeCart(id),
    onSuccess: async () => {
      showNotice("Item removed from bag.");
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => showNotice(getError(error)),
  });

  const isMutating = updateCart.isPending || removeCart.isPending;

  if (cart.isLoading) return <CartSkeleton />;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end gap-2">
        <h1 className="text-4xl font-bold sm:text-5xl">Your bag</h1>
        <p className="pb-1 text-base opacity-50 sm:text-lg">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-600">
          {notice}
        </div>
      )}

      {cart.error && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600">
          {getError(cart.error)}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
          <p className="mb-2 text-3xl">🛍️</p>
          <h2 className="text-xl font-bold">Your bag is empty</h2>
          <p className="mt-2 text-sm opacity-60">
            Add something you love before checkout.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-primary px-7 py-3 font-bold text-primaryForeground"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.product;
              const lineTotal = Number(item.price) * item.quantity;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5"
                >
                  <div className="grid grid-cols-[92px_1fr] gap-4 sm:grid-cols-[112px_1fr_auto] sm:items-center">
                    <Link
                      href={`/product/${product.slug}`}
                      className="relative aspect-square overflow-hidden rounded-2xl bg-background sm:h-28 sm:w-28"
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </Link>

                    <div className="min-w-0">
                      <Link href={`/product/${product.slug}`}>
                        <h2 className="line-clamp-2 text-sm font-bold leading-snug hover:underline sm:text-base">
                          {product.name}
                        </h2>
                      </Link>

                      {item.size && (
                        <p className="mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-xs opacity-70">
                          Size: {item.size}
                        </p>
                      )}

                      <p className="mt-2 text-sm opacity-60 sm:hidden">
                        {money(Number(item.price))} each
                      </p>

                      <div className="mt-3 flex max-w-full flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-full border border-border bg-background">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              item.quantity <= 1
                                ? removeCart.mutate(item.id)
                                : updateCart.mutate({
                                    id: item.id,
                                    quantity: item.quantity - 1,
                                  })
                            }
                            className="px-3 py-2 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            −
                          </button>
                          <span className="min-w-8 px-2 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() =>
                              updateCart.mutate({
                                id: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                            className="px-3 py-2 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => removeCart.mutate(item.id)}
                          className="rounded-full border border-border px-3 py-2 text-xs font-semibold opacity-70 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-between border-t border-border pt-3 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                      <p className="text-xs opacity-50 sm:mb-1">Total</p>
                      <p className="whitespace-nowrap text-base font-bold sm:text-lg">
                        {money(lineTotal)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 lg:sticky lg:top-24">
            <div className="space-y-4 text-sm sm:text-base">
              <div className="flex justify-between gap-4">
                <span className="opacity-60">
                  Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
                </span>
                <span className="whitespace-nowrap">{money(subtotal)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="opacity-60">Shipping</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>

              <div className="flex justify-between gap-4 border-t border-border pt-4 text-lg font-bold">
                <span>Total</span>
                <span className="whitespace-nowrap">{money(subtotal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-full bg-primary px-6 py-3 text-center font-bold text-primaryForeground transition hover:opacity-90"
            >
              Checkout
            </Link>

            <Link
              href="/shop"
              className="mt-3 block w-full rounded-full border border-border px-6 py-3 text-center font-bold transition hover:bg-muted"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
