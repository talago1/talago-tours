import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { resolveServerLanguage } from '@/lib/i18n.server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
const gaId = process.env.NEXT_PUBLIC_GA_ID;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const socialLinks = [
  'https://instagram.com/talago',
  'https://facebook.com/talago',
  'https://twitter.com/talago',
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: baseUrl,
      name: 'TALAGO',
      alternateName: 'TALAGO Tours',
      description: 'TALAGO — Egypt tours and experiences across the Red Sea, Nile and beyond.',
      inLanguage: 'en',
      publisher: { '@id': `${baseUrl}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/tours?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'TALAGO',
      alternateName: 'TALAGO Tours',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.svg`,
      },
      image: `${baseUrl}/og/default.png`,
      description:
        'TALAGO is a global Egypt tours and experiences platform — Red Sea islands, desert safaris, diving and historic Nile days across Hurghada, Sharm El Sheikh, Marsa Alam, Cairo and Luxor.',
      sameAs: socialLinks,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'tala.tour@outlook.com',
        availableLanguage: ['English', 'German', 'Russian', 'Italian', 'French', 'Polish', 'Spanish'],
      },
    },
    {
      '@type': 'TravelAgency',
      '@id': `${baseUrl}/#travelagency`,
      name: 'TALAGO',
      url: baseUrl,
      image: `${baseUrl}/og/default.png`,
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
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: 'TALAGO',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/og/default.jpg',
  },
  title: {
    template: '%s | TALAGO',
    default: 'TALAGO | Egypt Tours & Experiences',
  },
  description:
    'Discover and book vetted Egypt tours and experiences — Red Sea islands, desert safaris, diving and historic Nile days in Hurghada, Sharm El Sheikh, Marsa Alam, Cairo and Luxor. Instant confirmation and local support.',
  keywords: [
    'TALAGO',
    'Egypt tours',
    'Egypt excursions',
    'Hurghada tours',
    'Sharm El Sheikh tours',
    'Marsa Alam tours',
    'Cairo tours',
    'Luxor tours',
    'Red Sea excursions',
    'Red Sea diving',
    'desert safari Egypt',
  ],
  authors: [{ name: 'TALAGO' }],
  creator: 'TALAGO',
  publisher: 'TALAGO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'TALAGO | Egypt Tours & Experiences',
    description:
      'Book vetted tours and experiences across Egypt — Red Sea islands, desert safaris, diving and historic Nile days. Instant confirmation.',
    url: baseUrl,
    siteName: 'TALAGO',
    locale: 'en_US',
    alternateLocale: ['de_DE', 'ru_RU', 'fr_FR', 'it_IT', 'pl_PL', 'es_ES', 'uk_UA'],
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og/default.jpg`,
        secureUrl: `${baseUrl}/og/default.jpg`,
        width: 1200,
        height: 630,
        alt: 'TALAGO — Egypt Tours & Luxury Experiences',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TALAGO | Egypt Tours & Experiences',
    description:
      'Book vetted tours and experiences across Egypt — Red Sea islands, desert safaris, diving and historic Nile days.',
    images: [`${baseUrl}/og/default.jpg`],
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
  const language = resolveServerLanguage();

  return (
    <html lang={language}>
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

        <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
