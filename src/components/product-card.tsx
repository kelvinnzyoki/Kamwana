'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/money';
import type { Product } from '@/lib/types';

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

export function ProductCard({ p }: { p: Product }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const availableSizes = useMemo(
    () => new Set((p.sizes ?? []).map((size) => size.toUpperCase())),
    [p.sizes]
  );
  const hasSizes = availableSizes.size > 0;

  const addToCart = useMutation({
    mutationFn: () => api.addCart(p.id, 1, selectedSize || undefined),
    onSuccess: async () => {
      setMessage('Added');
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setMessage(''), 1400);
    },
    onError: (error: any) => {
      setMessage(error?.message || 'Failed');
      setTimeout(() => setMessage(''), 2500);
    },
  });

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

        <div>
          <p className="mb-1.5 text-xs font-semibold opacity-60">Sizes</p>
          <div className="flex flex-wrap gap-1.5">
            {SIZE_OPTIONS.map((size) => {
              const available = availableSizes.has(size);
              const active = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={!available}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`min-w-9 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primaryForeground'
                      : available
                      ? 'border-border hover:border-primary'
                      : 'cursor-not-allowed border-border opacity-30 line-through'
                  }`}
                  aria-pressed={active}
                  aria-label={
                    available
                      ? `Select size ${size}`
                      : `Size ${size} is unavailable`
                  }
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <b>{money(Number(p.price))}</b>
          <button
            type="button"
            disabled={addToCart.isPending || (hasSizes && !selectedSize)}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addToCart.mutate();
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addToCart.isPending
              ? 'Adding...'
              : message || (hasSizes && !selectedSize ? 'Size' : 'Add')}
          </button>
        </div>
      </div>
    </article>
  );
}
