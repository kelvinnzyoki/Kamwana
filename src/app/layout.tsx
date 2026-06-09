import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/Navbar';
import { ClasicClosetLogo } from '@/components/ClasicClosetLogo';
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>       {/* ← Navbar AND all pages must be inside this */}
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
export const metadata: Metadata = { title:'Classic Closet', description:'Modern luxury clothing shop' };
export default function RootLayout({children}:{children:React.ReactNode}){ return <html lang="en" suppressHydrationWarning><body><Providers><Header/><main className="min-h-screen pt-24">{children}</main><Footer/></Providers></body></html>; }
