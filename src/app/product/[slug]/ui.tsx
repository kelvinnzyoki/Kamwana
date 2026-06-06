'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function AddToCart({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const addToCart = useMutation({
    mutationFn: () => api.addCart(productId, 1),
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
      <button
        type="button"
        disabled={addToCart.isPending}
        onClick={() => addToCart.mutate()}
        className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {addToCart.isPending ? 'Adding...' : 'Add to bag'}
      </button>

      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
}
