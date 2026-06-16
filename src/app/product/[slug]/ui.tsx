'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

type Notice = {
  type: 'success' | 'error';
  text: string;
};

function getClientError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return 'Failed to add product to bag';
}

export function AddToCart({
  productId,
  sizes = [],
}: {
  productId: string;
  sizes?: string[];
}) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedSize, setSelectedSize] = useState('');

  const availableSizes = useMemo(
    () => new Set(sizes.map((size) => size.toUpperCase())),
    [sizes]
  );
  const hasSizes = availableSizes.size > 0;

  function showNotice(nextNotice: Notice, duration = 2500) {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), duration);
  }

  const addToCart = useMutation({
    mutationFn: () => api.addCart(productId, 1, selectedSize || undefined),
    onSuccess: async () => {
      showNotice({ type: 'success', text: 'Added to bag' }, 1400);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: unknown) => {
      showNotice({ type: 'error', text: getClientError(error) });
    },
  });

  function handleAdd() {
    if (hasSizes && !selectedSize) {
      showNotice({ type: 'error', text: 'Please select a size first' });
      return;
    }

    addToCart.mutate();
  }

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
                onClick={() => {
                  setSelectedSize(size);
                  setNotice(null);
                }}
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
        disabled={addToCart.isPending}
        onClick={handleAdd}
        className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {addToCart.isPending ? 'Adding...' : 'Add to bag'}
      </button>

      {notice && (
        <p
          className={`rounded-xl px-3 py-2 text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-green-500/10 text-green-600'
              : 'bg-red-500/10 text-red-600'
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
