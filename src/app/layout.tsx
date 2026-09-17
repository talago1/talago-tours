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
  url: baseUrl,
  logo: `${baseUrl}/images/logo.png`,
  image: `${baseUrl}/images/og-cover.jpg`,
  description:
    'Curated luxury yacht charters, private island escapes, and cinematic desert quad safaris in Hurghada and Sharm El Sheikh, Egypt.',
  priceRange: '$$',
  currenciesAccepted: 'USD, EUR, GBP',
  paymentAccepted: 'Credit Card, Cash',
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
    template: '%s | TALAGO — Luxury Experiences',
    default: 'TALAGO — Luxury Red Sea Cruises, Private Yachts & Desert Safaris in Hurghada',
  },
  description:
    'Curated luxury yacht charters, private island escapes, and cinematic desert quad safaris in Hurghada, Egypt with elite hospitality and 24/7 concierge support.',
  keywords: [
    'Hurghada tours',
    'Sharm El Sheikh tours',
    'Red Sea private yacht',
    'Hurghada desert quad safari',
    'Giftun Island private tour',
    'Ras Mohamed luxury cruise',
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
    title: 'TALAGO — Luxury Red Sea Cruises, Private Yachts & Desert Safaris',
    description:
      'Curated yacht-grade marine trips, private island escapes, and cinematic desert quad safaris with elite hospitality.',
    url: baseUrl,
    siteName: 'TALAGO Tours',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TALAGO — Luxury Red Sea & Desert Experiences',
    description:
      'Handcrafted luxury yacht charters and premium quad safaris in Egypt.',
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
