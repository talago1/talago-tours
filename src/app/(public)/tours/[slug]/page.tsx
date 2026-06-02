import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TourDetailsClient from './TourDetailsClient';
import type { ReviewDistribution, ApprovedReview } from '@/types/review';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tour = await prisma.tour.findUnique({
    where: { slug: params.slug },
    select: { translations: true },
  });

  const t = tour?.translations as Record<string, { title?: string; description?: string }> | undefined;
  const title = t?.en?.title ?? 'Tour';
  const description = t?.en?.description ?? '';

  return {
    title: `${title} — TALAGO`,
    description,
  };
}

export default async function TourDetailPage({ params }: Props) {
  const tour = await prisma.tour.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      basePrice: true,
      basePriceUSD: true,
      duration: true,
      durationHours: true,
      maxCapacity: true,
      thumbnailUrl: true,
      coverImage: true,
      galleryImages: true,
      category: true,
      status: true,
      translations: true,
      highlights: true,
      inclusions: true,
      exclusions: true,
      itinerary: true,
      whatToBring: true,
      pickupDescription: true,
      hotelPickupIncluded: true,
      ratingAverage: true,
      ratingCount: true,
      adultPrice: true,
      childPrice: true,
      infantPrice: true,
      allowDeposit: true,
      depositPercentage: true,
      allowPayAtLocation: true,
      images: true,
      destination: {
        select: { name: true, slug: true },
      },
    },
  });

  if (!tour || tour.status !== 'ACTIVE') {
    notFound();
  }

  const translations = tour.translations as Record<string, { title?: string; description?: string }>;
  const title = translations?.en?.title ?? 'Tour';
  const description = translations?.en?.description ?? '';

  const approvedReviews = await prisma.review.findMany({
    where: { tourId: tour.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customerName: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });

  const groups = await prisma.review.groupBy({
    by: ['rating'],
    where: { tourId: tour.id, status: 'APPROVED' },
    _count: { id: true },
  });

  const distributionMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  groups.forEach((g) => {
    distributionMap[g.rating] = g._count.id;
  });

  const total = tour.ratingCount;
  const distribution: ReviewDistribution[] = Object.entries(distributionMap).map(([star, count]) => ({
    star: Number(star),
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  const reviews: ApprovedReview[] = approvedReviews.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    comment: r.comment ?? '',
    createdAt: r.createdAt.toISOString(),
  }));

  const basePrice = tour.basePrice ? Number(tour.basePrice) : (tour.basePriceUSD ?? 0);

  // Gather all available images for the hero slider
  const galleryArray = (Array.isArray(tour.galleryImages) ? tour.galleryImages : []) as string[];
  const legacyImages = (Array.isArray(tour.images) ? tour.images : []) as string[];
  const allImages = [
    tour.coverImage,
    ...galleryArray,
    ...legacyImages,
    tour.thumbnailUrl,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0);

  return (
    <main className="min-h-screen bg-[#070F1E]">
      <TourDetailsClient
        tour={{
          id: tour.id,
          slug: tour.slug,
          title,
          description,
          basePrice,
          duration: tour.duration ?? `${tour.durationHours ?? 0}h`,
          maxCapacity: tour.maxCapacity,
          ratingAverage: tour.ratingAverage,
          ratingCount: tour.ratingCount,
          category: tour.category,
          destination: tour.destination ?? { name: '', slug: '' },
          highlights: tour.highlights as string[],
          inclusions: tour.inclusions as string[],
          exclusions: tour.exclusions as string[],
          itinerary: tour.itinerary as any[],
          whatToBring: String(tour.whatToBring ?? ''),
          pickupDescription: tour.pickupDescription,
          hotelPickupIncluded: tour.hotelPickupIncluded,
          images: allImages,
          adultPrice: tour.adultPrice ?? basePrice,
          childPrice: tour.childPrice ?? null,
          infantPrice: tour.infantPrice ?? null,
          allowDeposit: tour.allowDeposit,
          depositPercentage: tour.depositPercentage,
          allowPayAtLocation: tour.allowPayAtLocation,
          translations: tour.translations as Record<string, { title?: string; description?: string }>,
        }}
        reviews={{ distribution, reviews, ratingAverage: tour.ratingAverage, ratingCount: tour.ratingCount }}
      />
    </main>
  );
}
