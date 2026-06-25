'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiRequestError } from '@/lib/api';
import { ClasicClosetLogo } from '@/components/ClasicClosetLogo';

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const pathname = usePathname(); // ← usePathname avoids server/client hydration mismatch

  // ── Theme toggle ─────────────────────────────────────────────────────────────
  // next-themes reads localStorage/system preference only after mount. Rendering
  // the icon before that would mismatch server vs client HTML (hydration error)
  // and could briefly show the wrong icon. `mounted` gates the real icon until
  // the client has resolved the actual theme.
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Auth state ─────────────────────────────────────────────────────────────
  const { data: meData, isLoading: authLoading } = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });

  // Guard against unexpected response shapes
  const user = meData?.data?.user ?? null;

  // ── Cart count ─────────────────────────────────────────────────────────────
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: api.cart,
    retry: false,
    staleTime: 30 * 1000,
  });
  const cartCount: number =
    cartData?.data?.cart?.items?.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    ) ?? 0;

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Invalidate so every component using ['me'] immediately sees logged-out state
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
      setUserMenuOpen(false);
      setMenuOpen(false);
      window.location.href = '/';
    },
    onError: () => {
      // Even if the server call fails, clear local state and redirect
      queryClient.removeQueries({ queryKey: ['me'] });
      window.location.href = '/';
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <a href="/" className="shrink-0">
          {/* variant="auto" uses text-foreground, which flips with the
              dark/light theme via next-themes. variant="dark" hardcoded
              #111111 — invisible on a dark-mode navbar background. */}
          <ClasicClosetLogo variant="auto" />
        </a>

        {/* ── Desktop nav ───────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname?.startsWith(link.href) ? 'text-primary' : 'text-foreground/70'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* ── Right side ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {!mounted ? (
              // Placeholder keeps layout stable before hydration — avoids
              // a flash/jump when the real icon appears.
              <span className="w-5 h-5" />
            ) : resolvedTheme === 'dark' ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>

          {/* Cart badge */}
          <a
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={`Cart${cartCount > 0 ? ` — ${cartCount} items` : ''}`}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primaryForeground">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </a>

          {/* Auth — desktop only */}
          <div className="hidden md:block">
            {authLoading ? (
              // Skeleton while the ['me'] query is in-flight
              <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              // ── Logged in ────────────────────────────────────────────────
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primaryForeground">
                    {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                  <span className="max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                  <ChevronIcon open={userMenuOpen} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-border bg-background shadow-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs opacity-50 truncate">{user.email || user.phone}</p>
                        {!user.emailVerified && !user.phoneVerified && (
                          <a href="/account" className="mt-1 inline-block text-xs text-amber-600 underline">
                            Verify your account
                          </a>
                        )}
                      </div>
                      <div className="py-1">
                        <a href="/orders" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                          My Orders
                        </a>
                        <a href="/account" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                          Account Settings
                        </a>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => logout.mutate()}
                          disabled={logout.isPending}
                          className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {logout.isPending ? 'Signing out…' : 'Sign out'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // ── Not logged in ────────────────────────────────────────────
              <div className="flex items-center gap-2">
                <a href="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  Sign in
                </a>
                <a href="/login?mode=register"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primaryForeground hover:opacity-90 transition-opacity">
                  Join
                </a>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ───────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors ${
                  pathname?.startsWith(link.href) ? 'bg-muted' : ''
                }`}>
                {link.label}
              </a>
            ))}

            <div className="mt-2 border-t border-border pt-3 space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs opacity-50">{user.email || user.phone}</p>
                  </div>
                  <a href="/orders" onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm hover:bg-muted">My Orders</a>
                  <a href="/account" onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm hover:bg-muted">Account Settings</a>
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {logout.isPending ? 'Signing out…' : 'Sign out'}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <a href="/login" onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium">
                    Sign in
                  </a>
                  <a href="/login?mode=register" onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-primaryForeground">
                    Create account
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
