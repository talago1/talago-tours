import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { resolveServerLanguage } from '@/lib/i18n.server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';

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
      description: 'TALAGO — Book top-rated tours, activities & experiences worldwide. Discover Egypt, the Red Sea, and beyond.',
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
        'TALAGO is a global tours and experiences marketplace — discover and book curated activities across Egypt, the Red Sea, the Nile Valley, and destinations worldwide.',
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

// --------------------------------------------------------------------------
// generateMetadata: reads OG image / favicon from SystemSetting key `seo`.
// Next.js caches the result for 60 s (revalidate tag) so we avoid a DB hit
// on every single page load while still reflecting admin changes within a
// minute — no redeploy required.
// --------------------------------------------------------------------------
export const revalidate = 60;

async function getSeoSettings() {
  try {
    const record = await prisma.systemSetting.findUnique({ where: { key: 'seo' } });
    if (record?.value) {
      return parseSettingValue<{
        ogImage?: string;
        ogImageAlt?: string;
        faviconUrl?: string;
        siteTitle?: string;
        siteDescription?: string;
        twitterHandle?: string;
      }>(record.value, {});
    }
  } catch {
    // DB unavailable — fall back to static defaults silently
  }
  return {};
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  const defaultOgImage = `${baseUrl}/og/default.jpg`;
  const ogImage = seo.ogImage || defaultOgImage;
  const ogImageAlt = seo.ogImageAlt || 'TALAGO — World-Class Tours & Luxury Experiences';
  const faviconUrl = seo.faviconUrl || '/icon.svg';
  const siteTitle = seo.siteTitle || 'TALAGO | Book Top Tours, Activities & Experiences Worldwide';
  const siteDescription =
    seo.siteDescription ||
    'Discover and book top-rated tours, activities, and experiences worldwide with instant confirmation and flexible cancellation. Egypt, Red Sea, Nile Valley, and beyond.';
  const twitterHandle = seo.twitterHandle || '@talago';

  return {
    metadataBase: new URL(baseUrl),
    applicationName: 'TALAGO',
    icons: {
      icon: [
        { url: faviconUrl, type: faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png' },
      ],
      shortcut: faviconUrl,
      apple: ogImage,
    },
    title: {
      template: '%s | TALAGO',
      default: siteTitle,
    },
    description: siteDescription,
    keywords: [
      'TALAGO',
      'tours and activities',
      'book experiences worldwide',
      'Egypt tours',
      'Red Sea excursions',
      'Hurghada tours',
      'Sharm El Sheikh tours',
      'Cairo tours',
      'Luxor tours',
      'desert safari',
      'Red Sea diving',
      'travel experiences',
      'tour booking platform',
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
      title: siteTitle,
      description: siteDescription,
      url: baseUrl,
      siteName: 'TALAGO',
      locale: 'en_US',
      alternateLocale: ['de_DE', 'ru_RU', 'fr_FR', 'it_IT', 'pl_PL', 'es_ES', 'uk_UA'],
      type: 'website',
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
          type: ogImage.endsWith('.png') ? 'image/png' : 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: [ogImage],
      creator: twitterHandle,
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
}

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

        <CurrencyProvider>
          <WishlistProvider>
            <LanguageProvider initialLanguage={language}>{children}</LanguageProvider>
          </WishlistProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
