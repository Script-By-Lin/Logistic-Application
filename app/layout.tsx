import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrammelNet - Inventory Management',
  description: 'Production, distribution, and return tracking with TrammelNet',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
  },
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
