'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, SunMoon, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

export function Header() {
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['cart'], queryFn: api.cart, retry: false });
  const count = data?.data?.cart?.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;

  const nav = (
    <>
      <Link href="/shop" onClick={() => setOpen(false)}>Shop</Link>
      <Link href="/shop?category=Apparel" onClick={() => setOpen(false)}>Apparel</Link>
      <Link href="/shop?category=Footwear" onClick={() => setOpen(false)}>Footwear</Link>
      <Link href="/orders" onClick={() => setOpen(false)}>Orders</Link>
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/clasiccloset-logo.svg" alt="ClasicCloset" width={172} height={44} priority className="h-11 w-auto rounded-xl" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">{nav}</nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full border border-border p-2">
            <SunMoon size={18} />
          </button>
          <Link href="/cart" className="relative rounded-full border border-border p-2" aria-label="Cart">
            <ShoppingBag size={18} />
            {count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-primary px-2 text-xs font-bold text-primaryForeground">{count}</span>}
          </Link>
          <Link href="/login" className="hidden rounded-full bg-primary px-4 py-2 text-sm font-bold text-primaryForeground sm:inline-block">Sign in</Link>
          <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="rounded-full border border-border p-2 md:hidden">
            <Menu size={18} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="grid gap-4 border-t border-border bg-background px-4 py-5 text-sm font-semibold md:hidden">
          {nav}
          <Link href="/login" onClick={() => setOpen(false)} className="rounded-full bg-primary px-4 py-3 text-center text-primaryForeground">Sign in</Link>
        </nav>
      )}
    </header>
  );
}
