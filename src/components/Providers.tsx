'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Wrap your root layout with this component so that every page and
 * every component — including Navbar — shares one QueryClient instance.
 *
 * In src/app/layout.tsx:
 *
 *   import { Providers } from '@/app/providers';
 *   import { Navbar }    from '@/components/Navbar';
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html lang="en">
 *         <body>
 *           <Providers>           ← must wrap Navbar AND {children}
 *             <Navbar />
 *             <main>{children}</main>
 *           </Providers>
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * Without this, useQuery() has no QueryClient and returns
 * { data: undefined } on every call — which is why the Navbar
 * always shows the Sign In button even after a successful login.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per browser session, not per render.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,   // treat data as fresh for 1 min
            retry: false,            // don't retry 401s automatically
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
