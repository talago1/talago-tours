import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Talago Tours',
  description: 'Admin panel for Talago Tours',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
