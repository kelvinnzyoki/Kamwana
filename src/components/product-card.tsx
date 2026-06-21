'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/money';
import type { Product } from '@/lib/types';

type Notice = {
  type: 'success' | 'error';
  text: string;
};

function getClientError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to add product to bag';
}

export function ProductCard({ p }: { p: Product }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedSize, setSelectedSize] = useState('');

  // FIX: render buttons from the product's OWN sizes, not a hardcoded
  // clothing-only list. The previous SIZE_OPTIONS constant
  // (['S','M','L','XL',...]) was looped over regardless of category — p.sizes
  // was only ever used to compute which of THOSE fixed letters should be
  // enabled, so a shoe with sizes ["39","40","41"] showed every clothing
  // letter struck through and disabled, with the real sizes nowhere on
  // screen. Same bug, same fix as ui.tsx's AddToCart — this is the listing
  // grid's separate, lighter-weight card component, so it needed the
  // identical correction applied independently.
  const displaySizes = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of p.sizes ?? []) {
      const trimmed = raw.trim();
      const key = trimmed.toUpperCase();
      if (trimmed && !seen.has(key)) {
        seen.add(key);
        result.push(trimmed);
      }
    }
    return result;
  }, [p.sizes]);

  const hasSizes = displaySizes.length > 0;

  function showNotice(nextNotice: Notice, duration = 2500) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), duration);
  }

  const addToCart = useMutation({
    mutationFn: () => api.addCart(p.id, 1, selectedSize || undefined),
    onSuccess: async () => {
      showNotice({ type: 'success', text: 'Added to bag' }, 1400);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: unknown) => {
      showNotice({ type: 'error', text: getClientError(error) });
    },
  });

  function handleAdd(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (hasSizes && !selectedSize) {
      showNotice({ type: 'error', text: 'Please select a size first' });
      return;
    }

    addToCart.mutate();
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative aspect-[4/5]">
          <Image src={p.image} alt={p.name} fill className="object-cover" />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <Link href={`/product/${p.slug}`} className="block">
          <h3 className="font-semibold hover:underline">{p.name}</h3>
        </Link>

        <p className="line-clamp-2 text-sm opacity-70">{p.description}</p>

        {hasSizes && (
          <div>
            <p className="mb-1.5 text-xs font-semibold opacity-60">Sizes</p>
            <div className="flex flex-wrap gap-1.5">
              {displaySizes.map((size) => {
                const active = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedSize(size);
                      setNotice(null);
                    }}
                    className={`min-w-9 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primaryForeground'
                        : 'border-border hover:border-primary'
                    }`}
                    aria-pressed={active}
                    aria-label={`Select size ${size}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <b>{money(Number(p.price))}</b>
          <button
            type="button"
            disabled={addToCart.isPending}
            onClick={handleAdd}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addToCart.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>

        {notice && (
          <p
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              notice.type === 'success'
                ? 'bg-green-500/10 text-green-600'
                : 'bg-red-500/10 text-red-600'
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>
    </article>
  );
}
