import type { Metadata } from 'next';
import './globals.css';
import PwaManager from './components/PwaManager';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'TrammelNet - Inventory Management',
  description: 'Production, distribution, and return tracking with TrammelNet',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TrammelNet',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaManager />
        {children}
      </body>
    </html>
  );
}
