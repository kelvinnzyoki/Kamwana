'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

  // FIX: render buttons from the product's OWN sizes, not a hardcoded
  // clothing-only list. The previous SIZE_OPTIONS constant
  // (['S','M','L','XL',...]) was used for the button loop regardless of
  // category — `sizes` was only ever used to compute which of THOSE fixed
  // letters were available, so shoe sizes like 39/40/41 had nowhere to
  // render at all; only clothing letters ever appeared (all disabled,
  // since they're never in a shoe's actual sizes array).
  //
  // Preserves the original casing from the database (uppercased only for
  // matching/dedup) since shoe sizes like "39" have no meaningful case,
  // and forcing .toUpperCase() on a number string is harmless but
  // unnecessary — keeping the trimmed original avoids any surprise with
  // sizes that aren't plain letters.
  const displaySizes = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of sizes) {
      const trimmed = raw.trim();
      const key = trimmed.toUpperCase();
      if (trimmed && !seen.has(key)) {
        seen.add(key);
        result.push(trimmed);
      }
    }
    return result;
  }, [sizes]);

  const hasSizes = displaySizes.length > 0;

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
      {hasSizes && (
        <div>
          <p className="mb-2 text-sm font-semibold opacity-70">Size</p>
          <div className="flex flex-wrap gap-2">
            {displaySizes.map((size) => {
              const active = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setSelectedSize(size);
                    setNotice(null);
                  }}
                  className={`min-w-12 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
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
