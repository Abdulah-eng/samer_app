import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Digital Delivery Portal - Redeem Code & Order Status',
  description:
    'Custom digital product delivery website for Kinguin and GAMIVO merchants. Redeem your unique code and track account delivery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
