import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
const gaId = process.env.NEXT_PUBLIC_GA_ID;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'TALAGO Tours',
  alternateName: 'TALAGO Tours Egypt',
  url: baseUrl,
  logo: `${baseUrl}/talago-hero-red-sea-desert.png`,
  image: `${baseUrl}/og/default.png`,
  description:
    'TALAGO Tours — luxury yacht charters, private island escapes, desert safaris, and historical Nile tours in Egypt (Hurghada, Sharm El Sheikh, Marsa Alam, Luxor and Cairo). Handcrafted luxury yacht charters, private island escapes, desert safaris, and historical Nile tours.',
  priceRange: '$$',
  currenciesAccepted: 'USD, EUR, GBP, RUB, PLN, EGP',
  paymentAccepted: 'Credit Card, Cash on Arrival, Paymob',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Hurghada',
    addressRegion: 'Red Sea Governorate',
    addressCountry: 'EG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 27.2579,
    longitude: 33.8116,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    opens: '00:00',
    closes: '23:59',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: '%s | TALAGO Tours',
    default: 'TALAGO Tours — Luxury Yacht Charters, Desert Safaris & Egypt Excursions',
  },
  description:
    'Book handcrafted luxury yacht charters, private island days, desert quad safaris, diving expeditions and historic Nile tours across Hurghada, Sharm El Sheikh, Marsa Alam, Luxor and Cairo — vetted operators, best rates, instant confirmation.',
  keywords: [
    'TALAGO Tours',
    'Hurghada tours',
    'Sharm El Sheikh tours',
    'Marsa Alam tours',
    'Luxury yacht charter',
    'Red Sea excursions',
    'Hurghada desert quad safari',
    'Giftun Island private tour',
    'Ras Mohamed luxury cruise',
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
    title: 'TALAGO Tours — Luxury Red Sea Cruises & Egypt Excursions',
    description:
      'Discover and book luxury yacht charters, private desert safaris and historic Nile tours with TALAGO Tours — instant confirmation and guaranteed best rates.',
    url: baseUrl,
    siteName: 'TALAGO Tours',
    locale: 'en_US',
    alternateLocale: ['de_DE', 'ru_RU', 'fr_FR', 'it_IT', 'pl_PL', 'es_ES'],
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og/default.png`,
        width: 1200,
        height: 630,
        alt: 'TALAGO Tours — luxury Red Sea & desert experiences',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TALAGO Tours — Global Luxury Experiences',
    description:
      'Handcrafted luxury yacht charters, desert safaris, and Nile wonders in Egypt.',
    images: [`${baseUrl}/og/default.png`],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
