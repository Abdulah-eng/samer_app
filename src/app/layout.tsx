import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LiveChatWidget } from '@/components/LiveChatWidget';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'IMOSTRADA Digital Products Delivery Portal',
  description:
    'Custom digital product delivery website for GAMIVO, G2A and Driffle merchants. Redeem your unique code and track account, key or top-up delivery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 selection:bg-amber-400 selection:text-black">
        {children}
        <LiveChatWidget />
      </body>
    </html>
  );
}
