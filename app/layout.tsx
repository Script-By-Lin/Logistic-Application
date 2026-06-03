import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrammelNet - Inventory Management',
  description: 'Production, distribution, and return tracking with TrammelNet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
