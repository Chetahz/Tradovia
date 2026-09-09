import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_Thai } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const thaiFont = Noto_Sans_Thai({
  variable: '--font-thai',
  subsets: ['thai'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Tradovia — Your Trading Operating System',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/brand/icon-180.png' },
  appleWebApp: { capable: true, title: 'Tradovia' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${thaiFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
