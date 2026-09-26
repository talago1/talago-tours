export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import TourSearchHeaderWrapper from '@/components/public/TourSearchHeaderWrapper';
import PublicTourCard from '@/components/tours/PublicTourCard';
import ToursHero from './ToursHero';
import ToursEmptyState from './ToursEmptyState';

export const metadata: Metadata = {
  title: 'Tours & Journeys — TALAGO',
  description:
    'Explore our hand-curated portfolio of luxury yachts, private island charters, snorkeling, diving, desert safaris and more across Hurghada, Sharm El Sheikh and Marsa Alam.',
};

// Maps the public filter button value (uppercase) → one or more possible DB category values.
const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  SNORKELING:    ['snorkeling', 'sea', 'Sea'],
  DIVING:        ['diving',     'sea', 'Sea'],
  BOAT_TRIP:     ['boat_trip',  'sea', 'Sea'],
  ADVENTURE:     ['adventure',  'sea', 'Sea'],
  CITY:          ['city',       'sea', 'Sea'],
  SAFARI:        ['safari',           'Safari'],
  DESERT:        ['desert',    'safari', 'Safari'],
  CULTURAL:      ['cultural', 'Cultural', 'Historical'],
  SPA:           ['spa', 'Spa & Wellness', 'wellness'],
  ENTERTAINMENT: ['entertainment', 'Entertainment'],
};

function buildSort(orderBy: string | undefined): Record<string, 'asc' | 'desc'> {
  switch (orderBy) {
    case 'price_asc':    return { adultPrice: 'asc'  as const };
    case 'price_desc':   return { adultPrice: 'desc' as const };
    case 'duration_asc': return { durationHours: 'asc'  as const };
    case 'duration_desc':return { durationHours: 'desc' as const };
    default:             return { isBestSeller: 'desc' as const };
  }
}

interface CatalogPageProps {
  searchParams: {
    destination?: string;
    type?: string;
    search?: string;
    sort?: string;
  };
}

async function CatalogContent({ searchParams: filters }: { searchParams: CatalogPageProps['searchParams'] }) {
  const where: Record<string, unknown> = { status: 'ACTIVE' };

  if (filters.destination) {
    where.destination = { slug: filters.destination };
  }

  if (filters.type) {
    const dbCategories = CATEGORY_FILTER_MAP[filters.type.toUpperCase()];
    if (dbCategories && dbCategories.length > 0) {
      where.category = { in: dbCategories };
    }
  }

  const [totalCount, allTours, destinations] = await Promise.all([
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
    prisma.tour.findMany({
      where,
      orderBy: [
        buildSort(filters.sort),
        { ratingAverage: 'desc' },
        { ratingCount: 'desc' },
      ],
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
        destination: {
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.destination.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
    }).catch(() => [] as { name: string; slug: string }[]),
  ]);

  // In-memory search filter for multilingual JSON fields
  const tours = filters.search
    ? allTours.filter((t) => {
        const lower = filters.search!.toLowerCase();
        const tData = t.translations as Record<string, { title?: string }>;
        return Object.values(tData).some(
          (entry) => entry?.title && entry.title.toLowerCase().includes(lower),
        );
      })
    : allTours;

  const filteredCount = tours.length;

  return (
    <div id="catalog" className="scroll-mt-8">
      <TourSearchHeaderWrapper
        destinations={destinations}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {tours.map((tour) => (
            <PublicTourCard key={tour.id} tour={tour} />
          ))}
          {tours.length === 0 && <ToursEmptyState />}
        </div>
      </div>
    </div>
  );
}

export default async function ToursPage({ searchParams }: CatalogPageProps) {
  const totalCount = await prisma.tour.count({ where: { status: 'ACTIVE' } });

  return (
    <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      <ToursHero totalCount={totalCount} />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:px-10 lg:pb-28">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[2rem] border border-white/5 bg-white/[0.04]">
                  <div className="aspect-[4/3] rounded-t-[2rem] bg-white/10" />
                  <div className="space-y-3 p-6">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                    <div className="h-8 w-full rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
