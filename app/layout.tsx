import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pipe Inventory Management',
  description: 'Production, distribution, and return tracking for pipe manufacturing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
