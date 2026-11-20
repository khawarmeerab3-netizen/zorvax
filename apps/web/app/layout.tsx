import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Zorvax — Your Personal AI Astrologer',
  description:
    'Zorvax pairs your real birth chart with Lyra, an AI astrologer that speaks with astrological authority.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink-900 font-sans text-slate-100 antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
