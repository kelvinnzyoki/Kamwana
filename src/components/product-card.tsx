'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { money } from '@/lib/money';
import type { Product } from '@/lib/types';

export function ProductCard({ p }: { p: Product }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const add = useMutation({
    mutationFn: () => api.addCart(p.id, 1),
    onSuccess: () => {
      setMessage('Added');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setMessage(''), 1200);
    },
    onError: (err: any) => {
      setMessage(err?.message || 'Failed');
      setTimeout(() => setMessage(''), 2000);
    },
  });

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <Link href={`/product/${p.slug}`}>
        <div className="relative aspect-[4/5]">
          <Image src={p.image} alt={p.name} fill className="object-cover" />
        </div>
      </Link>

      <div className="space-y-2 p-4">
        <h3 className="font-semibold">{p.name}</h3>
        <p className="line-clamp-2 text-sm opacity-70">{p.description}</p>

        <div className="flex items-center justify-between gap-3">
          <b>{money(Number(p.price))}</b>
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate()}
            className="rounded-full bg-foreground px-4 py-2 text-sm text-background disabled:opacity-60"
          >
            {add.isPending ? 'Adding...' : message || 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
