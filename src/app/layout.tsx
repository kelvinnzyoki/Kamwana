import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
export const metadata: Metadata = { title:'Classic Closet', description:'Modern luxury clothing shop' };
export default function RootLayout({children}:{children:React.ReactNode}){ return <html lang="en" suppressHydrationWarning><body><Providers><Header/><main className="min-h-screen pt-24">{children}</main><Footer/></Providers></body></html>; }
