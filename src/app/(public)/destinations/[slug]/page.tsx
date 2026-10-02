export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import PublicTourCard from '@/components/tours/PublicTourCard';
import { resolveServerLanguage } from '@/lib/i18n.server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
const CONTENT_LANGUAGES = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'] as const;

type DestTranslations = Record<string, { name?: string; description?: string } | undefined>;

function localized(
  translations: DestTranslations | null,
  lang: string,
  field: 'name' | 'description',
  fallback: string,
): string {
  return translations?.[lang]?.[field] || translations?.en?.[field] || fallback;
}

async function getDestination(slug: string) {
  return prisma.destination.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = resolveServerLanguage(searchParams);
  const dest = await getDestination(params.slug);
  if (!dest) return { title: 'Destination not found' };

  const t = dest.translations as DestTranslations | null;
  const name = localized(t, lang, 'name', dest.name);
  const description = localized(
    t,
    lang,
    'description',
    dest.description || `Discover and book the best ${name} tours, excursions and experiences with TALAGO.`,
  );
  const url = `${baseUrl}/destinations/${dest.slug}`;

  return {
    title: `${name} Tours & Experiences`,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries([
        ...CONTENT_LANGUAGES.map((code) => [code, `${url}?lang=${code}`]),
        ['x-default', url],
      ]),
    },
    openGraph: {
      title: `${name} Tours & Experiences | TALAGO`,
      description,
      url,
      siteName: 'TALAGO',
      locale: `${lang}_${lang.toUpperCase()}`,
      type: 'website',
      images: dest.imageUrl ? [{ url: dest.imageUrl, width: 1200, height: 630, alt: name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} Tours & Experiences | TALAGO`,
      description,
      images: dest.imageUrl ? [dest.imageUrl] : undefined,
    },
  };
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const lang = resolveServerLanguage(searchParams);
  const [dest, siblings] = await Promise.all([
    getDestination(params.slug),
    prisma.destination.findMany({
      where: { NOT: { slug: params.slug } },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true, translations: true },
      take: 8,
    }),
  ]);

  if (!dest) notFound();

  const tours = await prisma.tour.findMany({
    where: { status: 'ACTIVE', destinationId: dest.id },
    orderBy: [{ isBestSeller: 'desc' }, { ratingAverage: 'desc' }, { ratingCount: 'desc' }],
    select: {
      id: true,
      slug: true,
      coverImage: true,
      galleryImages: true,
      thumbnailUrl: true,
      basePriceUSD: true,
      basePrice: true,
      duration: true,
      durationHours: true,
      translations: true,
      displayExcerpt: true,
      cardExcerpt: true,
      category: true,
      ratingAverage: true,
      ratingCount: true,
      priceAdult: true,
      adultPrice: true,
      originalPrice: true,
      isBestSeller: true,
      isFeatured: true,
      isNew: true,
      customBadge: true,
      destination: { select: { name: true, slug: true } },
    },
  });

  const t = dest.translations as DestTranslations | null;
  const currentName = localized(t, lang, 'name', dest.name);
  const currentDescription = localized(t, lang, 'description', dest.description || '');
  const pageUrl = `${baseUrl}/destinations/${dest.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristDestination',
        '@id': `${pageUrl}#destination`,
        name: currentName,
        description: currentDescription,
        url: pageUrl,
        image: dest.imageUrl || `${baseUrl}/og/default.png`,
        ...(dest.latitude && dest.longitude
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: dest.latitude,
                longitude: dest.longitude,
              },
            }
          : {}),
        containedInPlace: {
          '@type': 'Country',
          name: 'Egypt',
        },
      },
      {
        '@type': 'ItemList',
        itemListElement: tours.map((tour, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${baseUrl}/tours/${tour.slug}`,
          name: (tour.translations as any)?.[lang]?.title || (tour.translations as any)?.en?.title || tour.slug,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Destinations',
            item: `${baseUrl}/destinations`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: currentName,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          {dest.imageUrl ? (
            <Image
              src={dest.imageUrl}
              alt={currentName}
              fill
              priority
              className="object-cover opacity-40"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0B1528] via-[#070F1E] to-[#0B1528]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/70 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-32 lg:px-10">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 transition hover:text-[#00E5FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All destinations
          </Link>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-3.5 py-1 text-xs font-black uppercase text-[#00E5FF]">
            <MapPin className="h-3.5 w-3.5" />
            {dest.countryCode || 'EG'} · {dest.city || dest.region || 'Egypt'}
          </div>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            {currentName}
          </h1>
          {currentDescription && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {currentDescription}
            </p>
          )}
          <p className="mt-5 text-sm font-bold text-[#FFD700]">
            {tours.length} {tours.length === 1 ? 'experience' : 'experiences'} available
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-10">
        {tours.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
            <p className="text-slate-300">
              No experiences are published for {currentName} yet.
            </p>
            <Link
              href="/tours"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#00E5FF] px-5 py-2.5 text-sm font-black text-[#070F1E]"
            >
              Browse all tours
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour, index) => (
              <PublicTourCard key={tour.id} tour={tour} priority={index < 3} />
            ))}
          </div>
        )}

        {siblings.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-8">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-400">
              Explore more of Egypt
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {siblings.map((s) => {
                const sName = localized(s.translations as DestTranslations | null, lang, 'name', s.name);
                return (
                  <Link
                    key={s.slug}
                    href={`/destinations/${s.slug}`}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 transition hover:border-[#00E5FF]/40 hover:text-white"
                  >
                    {sName}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
