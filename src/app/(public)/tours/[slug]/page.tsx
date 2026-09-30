export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import TourDetailsClient from './TourDetailsClient';
import type { ReviewDistribution, ApprovedReview } from '@/types/review';
import type { Metadata } from 'next';
import { safeParseItinerary, safeParseReviews } from '@/utils/tourJsonSchemas';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
  const tour = await prisma.tour.findUnique({
    where: { slug: params.slug },
    select: {
      translations: true,
      coverImage: true,
      priceAdult: true,
      adultPrice: true,
      basePrice: true,
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      destination: { select: { name: true } },
    },
  });

  const t = tour?.translations as Record<string, { title?: string; description?: string; seoTitle?: string; seoDescription?: string }> | undefined;
  const title = tour?.metaTitle || t?.en?.seoTitle || t?.en?.title || 'Luxury Tour';
  const description = tour?.metaDescription || t?.en?.seoDescription || t?.en?.description || 'Curated VIP tour and excursion in Hurghada, Red Sea, Egypt.';
  const image = tour?.coverImage || `${baseUrl}/og/default.png`;
  const price = tour?.priceAdult ?? tour?.adultPrice ?? tour?.basePrice ?? 0;
  const pageUrl = `${baseUrl}/tours/${params.slug}`;

  return {
    title: `${title} | TALAGO Tours`,
    description,
    keywords: tour?.keywords && tour.keywords.length > 0 ? tour.keywords : undefined,
    alternates: {
      canonical: pageUrl,
      languages: {
        en: `${pageUrl}?lang=en`,
        de: `${pageUrl}?lang=de`,
        ru: `${pageUrl}?lang=ru`,
        it: `${pageUrl}?lang=it`,
        fr: `${pageUrl}?lang=fr`,
        pl: `${pageUrl}?lang=pl`,
        es: `${pageUrl}?lang=es`,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      title: `${title} — TALAGO Tours`,
      description,
      url: pageUrl,
      siteName: 'TALAGO Tours',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — TALAGO Tours`,
      description,
      images: [image],
    },
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
      priceAdult: true,
      originalPrice: true,
      childPrice: true,
      priceChild: true,
      infantPrice: true,
      pickupTime: true,
      pickupTimes: true,
      pickupType: true,
      meetingPointName: true,
      meetingPointAddress: true,
      meetingPointLat: true,
      meetingPointLng: true,
      meetingPointLandmark: true,
      meetingPointInstructions: true,
      meetingPointMapUrl: true,
      meetingPointImageUrl: true,
      cancellationPolicy: true,
      allowDeposit: true,
      depositPercentage: true,
      allowPayAtLocation: true,
      images: true,
      reviews: true,
      reviewEntries: {
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      ageRestrictionsNotes: true,
      destinationId: true,
      tourOptions: true,
      destination: {
        select: { name: true, slug: true },
      },
    },
  });

  if (!tour || (tour.status && tour.status.toUpperCase() !== 'ACTIVE')) {
    notFound();
  }

  // Fetch related active tours from the same destination (or general active tours)
  const rawRelated = await prisma.tour.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: tour.id },
      ...(tour.destinationId ? { destinationId: tour.destinationId } : {}),
    },
    take: 4,
    orderBy: { ratingAverage: 'desc' },
    select: {
      id: true,
      slug: true,
      coverImage: true,
      thumbnailUrl: true,
      basePrice: true,
      basePriceUSD: true,
      adultPrice: true,
      priceAdult: true,
      duration: true,
      durationHours: true,
      ratingAverage: true,
      category: true,
      translations: true,
      destination: {
        select: { name: true, slug: true },
      },
    },
  });

  const relatedTours = rawRelated.map((rt) => {
    const rTrans = rt.translations as Record<string, { title?: string }> | null;
    const rTitle = rTrans?.en?.title || 'Tour Experience';
    const effectivePrice = rt.priceAdult ?? rt.adultPrice ?? rt.basePrice ?? rt.basePriceUSD ?? 0;
    return {
      id: rt.id,
      slug: rt.slug,
      title: rTitle,
      basePrice: effectivePrice,
      duration: rt.duration || (rt.durationHours ? `${rt.durationHours}h` : null),
      rating: rt.ratingAverage || 5,
      thumbnailUrl: rt.thumbnailUrl || rt.coverImage || null,
      category: (rt.category as any) || null,
      destination: rt.destination || { name: 'Red Sea', slug: 'red-sea' },
      translations: rt.translations,
    };
  });

  const translations = tour.translations as Record<string, { title?: string; description?: string }>;
  const title = translations?.en?.title ?? 'Tour';
  const description = translations?.en?.description ?? '';

  const transObj = tour.translations as Record<string, any> | null;
  const enObj = transObj?.en || {};
  const requirements = enObj.requirements || null;
  const accessibilityNotes = enObj.accessibilityNotes || null;
  const wheelchairAccessible = enObj.wheelchairAccessible ?? null;
  const strollerAccessible = enObj.strollerAccessible ?? null;
  const safetyGuidelines = Array.isArray(enObj.safetyGuidelines) ? enObj.safetyGuidelines : [];
  const faqItems = Array.isArray(enObj.faqItems) ? enObj.faqItems : [];
  const rawTourOptions = Array.isArray(tour.tourOptions) ? (tour.tourOptions as any[]) : [];
  const tourOptions = rawTourOptions
    .filter((opt): opt is Record<string, any> => typeof opt === 'object' && opt !== null)
    .map((opt) => ({
      id: String(opt.id || ''),
      title: opt.title ? String(opt.title) : undefined,
      name: opt.name ? String(opt.name) : undefined,
      description: opt.description ? String(opt.description) : undefined,
      price: Number(opt.price || 0),
      priceType: opt.priceType ? String(opt.priceType) : undefined,
      enabled: opt.enabled !== false,
    }));

  // Merge reviews from both sources: reviewEntries (relation) and reviews (JSON)
  const jsonReviews = safeParseReviews(tour.reviews);

  const relationReviews = (tour.reviewEntries ?? []).filter((r) => r.status === 'APPROVED');

  const combinedRawReviews = [
    ...relationReviews.map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment ?? '',
      status: r.status,
      createdAt: r.createdAt,
    })),
    ...jsonReviews.filter((j: any) => j.status === 'APPROVED' || !j.status),
  ];

  const distributionMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  combinedRawReviews.forEach((r: any) => {
    const stars = r.rating ?? r.stars ?? 5;
    if (distributionMap[stars] !== undefined) {
      distributionMap[stars]++;
    }
  });

  const total = combinedRawReviews.length;
  const distribution: ReviewDistribution[] = Object.entries(distributionMap).map(([star, count]) => ({
    star: Number(star),
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  const reviews: ApprovedReview[] = combinedRawReviews.map((r: any) => ({
    id: r.id || r._id || crypto.randomUUID(),
    customerName: r.customerName || r.authorName || 'Verified Guest',
    rating: r.rating ?? r.stars ?? 5,
    comment: r.comment ?? r.text ?? '',
    createdAt: r.createdAt
      ? new Date(r.createdAt).toISOString()
      : r.date
        ? new Date(r.date).toISOString()
        : new Date().toISOString(),
  }));

  const basePrice = tour.basePrice ? Number(tour.basePrice) : (tour.basePriceUSD ?? 0);

  // Gather all available images for the hero slider — safe cast
  const galleryArray = Array.isArray(tour.galleryImages) ? (tour.galleryImages as string[]) : [];
  const legacyImages = Array.isArray(tour.images) ? (tour.images as string[]) : [];
  const allImages = [
    tour.coverImage,
    ...galleryArray,
    ...legacyImages,
    tour.thumbnailUrl,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
  const effectivePrice = tour.priceAdult ?? tour.adultPrice ?? basePrice;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: title,
    description: description,
    image: allImages.length > 0 ? allImages : [`${baseUrl}/talago-hero-red-sea-desert.png`],
    touristType: ['Luxury', 'Adventure', 'Family', 'Couples'],
    offers: {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/tours/${tour.slug}`,
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'TALAGO Tours',
      url: baseUrl,
    },
    ...(tour.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tour.ratingAverage.toFixed(1),
            reviewCount: tour.ratingCount,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
  };

  // Global payment method master toggles from /admin/settings
  const pmSetting = await prisma.systemSetting.findUnique({
    where: { key: 'paymentMethods' },
  });
  let paymentMethods = {
    allowPayOnArrival: true,
    allowFullOnline: true,
    allowDepositOnline: true,
    defaultDepositPercentage: 20,
    allowPaymentLink: true,
  };
  if (pmSetting?.value) {
    try {
      paymentMethods = { ...paymentMethods, ...JSON.parse(pmSetting.value) };
    } catch {
      // fallback to defaults
    }
  }

  const effectiveAllowPayAtLocation = paymentMethods.allowPayOnArrival !== false;
  const effectiveAllowFullOnline = paymentMethods.allowFullOnline !== false;
  const effectiveAllowDeposit = paymentMethods.allowDepositOnline !== false && (tour.allowDeposit || (paymentMethods.defaultDepositPercentage ?? 0) > 0);
  const effectiveDepositPercentage = Number(tour.depositPercentage || paymentMethods.defaultDepositPercentage || 20);

  const effectivePickupTimes: string[] = Array.isArray(tour.pickupTimes) && tour.pickupTimes.length > 0
    ? tour.pickupTimes
    : (tour.pickupTime ? String(tour.pickupTime).split('|').map((t: string) => t.trim()).filter(Boolean) : []);

  return (
    <main className="min-h-screen bg-[#070F1E]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          itinerary: safeParseItinerary(tour.itinerary),
          whatToBring: String(tour.whatToBring ?? ''),
          pickupDescription: tour.pickupDescription,
          hotelPickupIncluded: tour.hotelPickupIncluded,
          pickupType: tour.pickupType || 'hotel',
          meetingPointName: tour.meetingPointName,
          meetingPointAddress: tour.meetingPointAddress,
          meetingPointLat: tour.meetingPointLat,
          meetingPointLng: tour.meetingPointLng,
          meetingPointLandmark: tour.meetingPointLandmark,
          meetingPointInstructions: tour.meetingPointInstructions,
          meetingPointMapUrl: tour.meetingPointMapUrl,
          meetingPointImageUrl: tour.meetingPointImageUrl,
          images: allImages,
          adultPrice: tour.priceAdult ?? tour.adultPrice ?? basePrice,
          childPrice: tour.priceChild ?? tour.childPrice ?? null,
          infantPrice: tour.infantPrice ?? null,
          pickupTime: tour.pickupTime,
          pickupTimes: effectivePickupTimes,
          cancellationPolicy: tour.cancellationPolicy,
          allowDeposit: effectiveAllowDeposit,
          depositPercentage: effectiveDepositPercentage,
          allowPayAtLocation: effectiveAllowPayAtLocation,
          allowFullOnline: effectiveAllowFullOnline,
          translations: tour.translations as Record<string, { title?: string; description?: string }>,
          requirements,
          accessibilityNotes,
          wheelchairAccessible,
          strollerAccessible,
          safetyGuidelines,
          faqItems,
          tourOptions,
          ageRestrictionsNotes: tour.ageRestrictionsNotes,
        }}
        reviews={{ distribution, reviews, ratingAverage: tour.ratingAverage, ratingCount: tour.ratingCount }}
        relatedTours={relatedTours}
      />
    </main>
  );
}
