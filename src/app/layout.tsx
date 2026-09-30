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
  name: 'تالا جو | TALAGO Tours',
  alternateName: 'TALAGO Tours Egypt',
  url: baseUrl,
  logo: `${baseUrl}/talago-hero-red-sea-desert.png`,
  image: `${baseUrl}/talago-hero-red-sea-desert.png`,
  description:
    'تالا جو TALAGO Tours — منصة حجز الرحلات والتجارب السياحية الفاخرة في مصر (الغردقة، شرم الشيخ، مرسى علم، الأقصر والقاهرة). Handcrafted luxury yacht charters, private island escapes, desert safaris, and historical Nile tours.',
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
    template: '%s | تالا جو TALAGO Tours',
    default: 'تالا جو | TALAGO Tours — منصة التجارب السياحية الفاخرة والرحلات البحرية في مصر',
  },
  description:
    'تالا جو TALAGO Tours — احجز أفضل رحلات اليخوت الخاصة، سفاري الصحراء، جزيرة جفتون، رحلات الغوص وكنوز الأقصر والقاهرة بأعلى معايير الرفاهية والأمان والتأكيد الفوري 24/7.',
  keywords: [
    'تالا جو',
    'رحلات الغردقة',
    'رحلات شرم الشيخ',
    'رحلات مرسى علم',
    'TALAGO Tours',
    'Hurghada tours',
    'Sharm El Sheikh tours',
    'Marsa Alam tours',
    'Luxor tours',
    'Cairo Pyramids tour',
    'Red Sea private yacht',
    'Hurghada desert quad safari',
    'Giftun Island private tour',
    'Ras Mohamed luxury cruise',
    'Luxury Egypt excursions',
    'Hurghada Ausflüge',
    'Экскурсии в Хургаде',
  ],
  authors: [{ name: 'TALAGO Tours | تالا جو' }],
  creator: 'TALAGO Tours',
  publisher: 'TALAGO Tours',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'تالا جو | TALAGO Tours — Luxury Red Sea Cruises & Egypt Excursions',
    description:
      'اكتشف واحجز رحلات بحرية فاخرة، سفاري بيتش باجي، وجولات أثرية نيلية مع تالا جو TALAGO Tours بتأكيد فوري وضمان أفضل الأسعار.',
    url: baseUrl,
    siteName: 'تالا جو | TALAGO Tours',
    locale: 'en_US',
    alternateLocale: ['ar_EG', 'de_DE', 'ru_RU', 'fr_FR', 'it_IT', 'pl_PL', 'es_ES'],
    type: 'website',
    images: [
      {
        url: `${baseUrl}/talago-hero-red-sea-desert.png`,
        width: 1200,
        height: 630,
        alt: 'تالا جو | TALAGO Tours Luxury Red Sea & Desert Experiences',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تالا جو | TALAGO Tours — Global Luxury Experiences',
    description:
      'Handcrafted luxury yacht charters, desert safaris, and Nile wonders in Egypt.',
    images: [`${baseUrl}/talago-hero-red-sea-desert.png`],
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
