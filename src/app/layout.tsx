import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: '%s | TALAGO — Luxury Experiences',
    default: 'TALAGO — Luxury Red Sea Cruises, Private Yachts & Desert Safaris in Hurghada',
  },
  description:
    'Curated luxury yacht charters, private island escapes, and cinematic desert quad safaris in Hurghada, Egypt with elite hospitality and 24/7 concierge support.',
  keywords: [
    'Hurghada tours',
    'Red Sea private yacht',
    'Hurghada desert quad safari',
    'Giftun Island private tour',
    'Talago Tours',
    'Luxury Egypt excursions',
    'Hurghada Ausflüge',
    'Экскурсии в Хургаде',
  ],
  authors: [{ name: 'TALAGO Tours' }],
  creator: 'TALAGO Tours',
  publisher: 'TALAGO Tours',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'TALAGO — Luxury Red Sea Cruises, Private Yachts & Desert Safaris in Hurghada',
    description:
      'Curated yacht-grade marine trips, private island escapes, and cinematic desert quad safaris in Hurghada with elite hospitality.',
    url: baseUrl,
    siteName: 'TALAGO Tours',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TALAGO — Luxury Red Sea & Desert Experiences',
    description:
      'Handcrafted luxury yacht charters and premium quad safaris in Hurghada, Egypt.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
