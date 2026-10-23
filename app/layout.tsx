import type { Metadata } from 'next';
import './globals.css';
import './widget-studio.css';
import '../preview/fonts.css';

export const metadata: Metadata = {
  title: 'Tradovia — Your Trading Workspace',
  description: 'Your trading workspace for planning, journaling and review.',
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
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
