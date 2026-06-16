'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

export function AddToCart({
  productId,
  sizes = [],
}: {
  productId: string;
  sizes?: string[];
}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const availableSizes = useMemo(
    () => new Set(sizes.map((size) => size.toUpperCase())),
    [sizes]
  );
  const hasSizes = availableSizes.size > 0;

  const addToCart = useMutation({
    mutationFn: () => api.addCart(productId, 1, selectedSize || undefined),
    onSuccess: async () => {
      setMessage('Added to bag');
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setMessage(''), 1400);
    },
    onError: (error: any) => {
      setMessage(error?.message || 'Failed to add');
      setTimeout(() => setMessage(''), 2500);
    },
  });

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-sm font-semibold opacity-70">Size</p>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((size) => {
            const available = availableSizes.has(size);
            const active = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                disabled={!available}
                onClick={() => setSelectedSize(size)}
                className={`min-w-12 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
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

      <button
        type="button"
        disabled={addToCart.isPending || (hasSizes && !selectedSize)}
        onClick={() => addToCart.mutate()}
        className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {addToCart.isPending
          ? 'Adding...'
          : hasSizes && !selectedSize
          ? 'Select size'
          : 'Add to bag'}
      </button>

      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
}
