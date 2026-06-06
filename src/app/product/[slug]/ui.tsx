'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function AddToCart({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.addCart(productId, 1),
    onSuccess: () => {
      setMessage('Added to bag');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setMessage(''), 1400);
    },
    onError: (err: any) => {
      setMessage(err?.message || 'Failed to add');
      setTimeout(() => setMessage(''), 2200);
    },
  });

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      className="rounded-full bg-primary px-8 py-3 font-bold text-primaryForeground disabled:opacity-60"
    >
      {mutation.isPending ? 'Adding...' : message || 'Add to bag'}
    </button>
  );
}
