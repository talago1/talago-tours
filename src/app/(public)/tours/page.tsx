export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import TourSearchHeaderWrapper from '@/components/public/TourSearchHeaderWrapper';
import PublicTourCard from '@/components/tours/PublicTourCard';
import ToursCatalogHeader from './ToursCatalogHeader';
import ToursEmptyState from './ToursEmptyState';

export const metadata: Metadata = {
  title: 'Tours & Journeys — TALAGO',
  description: 'Explore our hand-curated portfolio of luxury yachts, private island charters, and premium desert quad safaris in Hurghada.',
};

type TourCategory = 'sea' | 'snorkeling' | 'diving' | 'boat_trip' | 'safari' | 'desert' | 'adventure' | 'city';

// Maps the public filter button value (uppercase) → one or more possible DB category values.
// The admin now stores granular lowercase values (e.g. 'snorkeling', 'diving').
// Legacy records use broad values: 'sea' or 'safari' (lowercase) or 'Sea'/'Safari' (capitalized).
// Clicking a granular filter first tries the exact value, then the broad parent as fallback.
const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  SNORKELING:  ['snorkeling', 'sea', 'Sea'],
  DIVING:      ['diving',     'sea', 'Sea'],
  BOAT_TRIP:   ['boat_trip',  'sea', 'Sea'],
  ADVENTURE:   ['adventure',  'sea', 'Sea'],
  CITY:        ['city',       'sea', 'Sea'],
  SAFARI:      ['safari',           'Safari'],
  DESERT:      ['desert',    'safari', 'Safari'],
};



function buildSort(orderBy: string | undefined): Record<string, 'asc' | 'desc'> {
  switch (orderBy) {
    case 'price_asc': return { adultPrice: 'asc' as const };
    case 'price_desc': return { adultPrice: 'desc' as const };
    case 'duration_asc': return { durationHours: 'asc' as const };
    case 'duration_desc': return { durationHours: 'desc' as const };
    default: return { createdAt: 'desc' as const };
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
  const where: Record<string, unknown> = {};

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
    prisma.tour.count(),
    prisma.tour.findMany({
      where,
      orderBy: buildSort(filters.sort),
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

  // In-memory search filter for multilingual JSON fields (Prisma has no JSON-path filter for PostgreSQL)
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
    <div>
      <TourSearchHeaderWrapper
        destinations={destinations}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {tours.map((tour) => (
            <PublicTourCard key={tour.id} tour={tour} />
          ))}
          {tours.length === 0 && (
            <ToursEmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ToursPage({ searchParams }: CatalogPageProps) {
  const params = searchParams;

  return (
    <main className="min-h-screen bg-[#070F1E] px-5 py-12 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <ToursCatalogHeader />

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
          <CatalogContent searchParams={params} />
        </Suspense>
      </div>
    </main>
  );
}
