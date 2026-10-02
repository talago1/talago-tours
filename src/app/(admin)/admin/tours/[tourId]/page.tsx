import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UnifiedTourEditor from '@/components/admin/UnifiedTourEditor';
import type { TourEditorData } from '@/types/tourEditor';
import { createDefaultTranslations, createDefaultLocalizedContent } from '@/types/tourEditor';

export const dynamic = 'force-dynamic';

interface Params {
  params: { tourId: string };
}

export default async function EditTourPage({ params }: Params) {
  const { tourId } = params;

  const [tour, zones, destinations] = await Promise.all([
    prisma.tour.findUnique({ where: { id: tourId } }),
    prisma.zone.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.destination.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!tour) notFound();

  // Normalize translations
  const baseTranslations = createDefaultTranslations();
  const rawTrans = (tour.translations as Record<string, any>) || {};
  for (const lang of ['en', 'de', 'ru', 'fr', 'it', 'pl', 'es'] as const) {
    if (rawTrans[lang]) {
      baseTranslations[lang] = {
        title: rawTrans[lang].title || '',
        shortTitle: rawTrans[lang].shortTitle || '',
        description: rawTrans[lang].description || '',
        cardExcerpt: rawTrans[lang].cardExcerpt || '',
        highlights: Array.isArray(rawTrans[lang].highlights) ? rawTrans[lang].highlights : [],
        inclusions: Array.isArray(rawTrans[lang].inclusions) ? rawTrans[lang].inclusions : [],
        exclusions: Array.isArray(rawTrans[lang].exclusions) ? rawTrans[lang].exclusions : [],
        whatToBring: rawTrans[lang].whatToBring || '',
        pickupDescription: rawTrans[lang].pickupDescription || '',
        cancellationPolicy: rawTrans[lang].cancellationPolicy || '',
        cancellationPolicies: Array.isArray(rawTrans[lang].cancellationPolicies) ? rawTrans[lang].cancellationPolicies : [],
        meetingPointInstructions: rawTrans[lang].meetingPointInstructions || '',
        safetyGuidelines: Array.isArray(rawTrans[lang].safetyGuidelines) ? rawTrans[lang].safetyGuidelines : [],
        seoTitle: rawTrans[lang].seoTitle || '',
        seoDescription: rawTrans[lang].seoDescription || '',
      };
    }
  }

  const initialData: Partial<TourEditorData> = {
    id: tour.id,
    slug: tour.slug,
    type: (tour.type as 'SHARED' | 'PRIVATE') || 'SHARED',
    status: (tour.status as any) || 'ACTIVE',
    basePriceUSD: tour.basePriceUSD || 0,
    durationHours: tour.durationHours || 1,
    maxCapacity: tour.maxCapacity || 10,
    zoneId: tour.zoneId,
    destinationId: tour.destinationId || '',
    countryCode: tour.countryCode || 'EG',
    region: tour.region || '',
    city: tour.city || '',
    latitude: tour.latitude ?? null,
    longitude: tour.longitude ?? null,
    timezone: tour.timezone || 'Africa/Cairo',
    category: tour.category || 'sea',
    coverImage: tour.coverImage || '',
    galleryImages: tour.galleryImages || [],
    highlights: tour.highlights || [],
    inclusions: tour.inclusions || [],
    exclusions: tour.exclusions || [],
    itinerary: (tour.itinerary as any[]) || [],
    whatToBring: tour.whatToBring || '',
    pickupDescription: tour.pickupDescription || '',
    hotelPickupIncluded: tour.hotelPickupIncluded,
    pickupType: (tour.pickupType as any) || 'hotel',
    meetingPointName: tour.meetingPointName || '',
    meetingPointAddress: tour.meetingPointAddress || '',
    meetingPointLat: tour.meetingPointLat ?? null,
    meetingPointLng: tour.meetingPointLng ?? null,
    meetingPointLandmark: tour.meetingPointLandmark || '',
    meetingPointInstructions: tour.meetingPointInstructions || '',
    meetingPointMapUrl: tour.meetingPointMapUrl || '',
    meetingPointImageUrl: tour.meetingPointImageUrl || '',
    pickupTimes: tour.pickupTimes && tour.pickupTimes.length > 0
      ? tour.pickupTimes
      : tour.pickupTime ? tour.pickupTime.split('|').map((s) => s.trim()).filter(Boolean) : [],
    cancellationPolicy: tour.cancellationPolicy || '',
    adultPrice: tour.adultPrice || tour.basePriceUSD || 0,
    originalPrice: tour.originalPrice || undefined,
    privatePrice: tour.pricePrivate || undefined,
    childEnabled: Boolean(tour.childPrice && tour.childPrice > 0),
    childPrice: tour.childPrice || 0,
    childMinAge: tour.childMinAge ?? 3,
    childMaxAge: tour.childMaxAge ?? 11,
    infantEnabled: Boolean(tour.infantPrice && tour.infantPrice > 0),
    infantPrice: tour.infantPrice || 0,
    infantMinAge: tour.infantMinAge ?? 0,
    infantMaxAge: tour.infantMaxAge ?? 2,
    ageRestrictionsNotes: tour.ageRestrictionsNotes || '',
    cardExcerpt: tour.cardExcerpt || '',
    showExcerptOnCard: tour.showExcerptOnCard,
    addons: (tour.tourOptions as any[]) || [],
    bookingQuestions: (tour.bookingQuestions as any[]) || [],
    allowDeposit: tour.allowDeposit,
    depositType: (tour.depositType as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE',
    depositPercentage: tour.depositPercentage,
    depositAmount: tour.depositAmount ?? undefined,
    allowPayAtLocation: tour.allowPayAtLocation,
    reviews: (tour.reviews as any[]) || [],
    // Badges & Marketing
    isFeatured: tour.isFeatured,
    isBestSeller: tour.isBestSeller,
    isRecommended: tour.isRecommended,
    isVip: tour.isVip,
    isFamilyFriendly: tour.isFamilyFriendly,
    isNew: tour.isNew,
    customBadge: tour.customBadge || '',
    secondaryCategories: tour.secondaryCategories || [],
    tags: tour.tags || [],
    // Transport & Logistics
    vehicleType: tour.vehicleType || '',
    boatType: tour.boatType || '',
    airConditioned: tour.airConditioned,
    transferNotes: tour.transferNotes || '',
    // Fitness & Accessibility
    fitnessLevel: tour.fitnessLevel || 'MODERATE',
    wheelchairAccessible: tour.wheelchairAccessible,
    strollerAccessible: tour.strollerAccessible,
    mobilityNotes: tour.mobilityNotes || '',
    accessibilityNotes: tour.accessibilityNotes || '',
    // Safety & Policies
    safetyGuidelines: tour.safetyGuidelines || [],
    insuranceIncluded: tour.insuranceIncluded,
    emergencyContact: tour.emergencyContact || '',
    freeCancellationHours: tour.freeCancellationHours ?? 24,
    // Scheduling
    instantConfirmation: tour.instantConfirmation,
    cutoffHours: tour.cutoffHours ?? 2,
    durationDisplay: tour.durationDisplay || '',
    // Route & Activities
    routeStops: (tour.routeStops as any[]) || [],
    activityTypes: tour.activityTypes || [],
    // Operator & Internal
    operatorName: tour.operatorName || '',
    operatorPhone: tour.operatorPhone || '',
    operatorEmail: tour.operatorEmail || '',
    internalNotes: tour.internalNotes || '',
    // Variants
    variants: (tour.variants as any[]) || [],
    // SEO
    metaTitle: tour.metaTitle || '',
    metaDescription: tour.metaDescription || '',
    keywords: tour.keywords || [],
    translations: baseTranslations,
  };

  return (
    <main className="min-h-screen bg-[#070F1E]">
      <UnifiedTourEditor
        zones={zones}
        destinations={destinations}
        initialData={initialData}
      />
    </main>
  );
}