import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/Navbar';
import { ClasicClosetLogo } from '@/components/ClasicClosetLogo';

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
