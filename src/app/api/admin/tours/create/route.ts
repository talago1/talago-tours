import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TourTranslationsRecordSchema, ItineraryStepSchema, SeededReviewSchema, TourAddonSchema, isValidCoverImage } from '@/utils/tourJsonSchemas';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const ALLOWED_TYPES = ['SHARED', 'PRIVATE'];
const REQUIRED_LANGUAGES = ['en', 'de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      slug,
      type,
      basePriceUSD,
      durationHours,
      maxCapacity,
      zoneId,
      translations,
      coverImage,
      galleryImages,
      category,
      status,
      allowDeposit,
      depositPercentage,
      depositType,
      depositAmount,
      allowPayAtLocation,
      highlights,
      inclusions,
      exclusions,
      itinerary,
      whatToBring,
      pickupDescription,
      hotelPickupIncluded,
      pickupTime,
      pickupTimes,
      pickupType,
      meetingPointName,
      meetingPointAddress,
      meetingPointLat,
      meetingPointLng,
      meetingPointLandmark,
      meetingPointInstructions,
      meetingPointMapUrl,
      meetingPointImageUrl,
      cancellationPolicy,
      adultPrice,
      originalPrice,
      privatePrice,
      costPerPerson,
      priceAdult,
      childEnabled,
      childPrice,
      priceChild,
      childMinAge,
      childMaxAge,
      infantEnabled,
      infantPrice,
      infantMinAge,
      infantMaxAge,
      ageRestrictionsNotes,
      destinationId,
      cardExcerpt,
      showExcerptOnCard,
      displayExcerpt,
      reviews,
      tourOptions,
      bookingQuestions,
      countryCode,
      region,
      city,
      latitude,
      longitude,
      timezone,
      // New UnifiedTourEditor fields
      isFeatured,
      isBestSeller,
      isRecommended,
      isVip,
      isFamilyFriendly,
      isNew,
      customBadge,
      secondaryCategories,
      tags,
      vehicleType,
      boatType,
      airConditioned,
      transferNotes,
      fitnessLevel,
      wheelchairAccessible,
      strollerAccessible,
      mobilityNotes,
      accessibilityNotes,
      safetyGuidelines,
      insuranceIncluded,
      emergencyContact,
      freeCancellationHours,
      instantConfirmation,
      cutoffHours,
      durationDisplay,
      routeStops,
      activityTypes,
      operatorName,
      operatorPhone,
      operatorEmail,
      internalNotes,
      variants,
      metaTitle,
      metaDescription,
      keywords,
      pickupAreas,
    } = body;

    const isDraft = status === 'DRAFT';

    let resolvedSlug = slug;
    if (!resolvedSlug || resolvedSlug.trim() === '') {
      resolvedSlug = `draft-${Date.now()}`;
    }

    if (!SLUG_REGEX.test(resolvedSlug) || resolvedSlug.length > 200) {
      if (isDraft) {
        resolvedSlug = `draft-${Date.now()}`;
      } else {
        return NextResponse.json(
          { error: 'Slug must be URL-safe (lowercase, numbers, hyphens) and under 200 characters', field: 'slug' },
          { status: 400 }
        );
      }
    }

    const resolvedType = ALLOWED_TYPES.includes(type) ? type : 'SHARED';
    if (!isDraft && !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Tour type must be SHARED or PRIVATE', field: 'type' },
        { status: 400 }
      );
    }

    const resolvedBasePrice = typeof basePriceUSD === 'number' && basePriceUSD >= 0 ? basePriceUSD : (adultPrice || 0);
    if (!isDraft && (typeof basePriceUSD !== 'number' || basePriceUSD <= 0)) {
      return NextResponse.json(
        { error: 'Base price must be a positive number', field: 'basePriceUSD' },
        { status: 400 }
      );
    }

    const resolvedDuration = Number.isInteger(durationHours) && durationHours > 0 ? durationHours : 1;
    if (!isDraft && (!Number.isInteger(durationHours) || durationHours <= 0)) {
      return NextResponse.json(
        { error: 'Duration must be a positive whole number', field: 'durationHours' },
        { status: 400 }
      );
    }

    const resolvedCapacity = Number.isInteger(maxCapacity) && maxCapacity > 0 ? maxCapacity : 10;
    if (!isDraft && (!Number.isInteger(maxCapacity) || maxCapacity <= 0)) {
      return NextResponse.json(
        { error: 'Max capacity must be a positive whole number', field: 'maxCapacity' },
        { status: 400 }
      );
    }

    const resolvedAdultPrice = typeof adultPrice === 'number' && adultPrice >= 0 ? adultPrice : (resolvedBasePrice || 0);
    if (!isDraft && (typeof adultPrice !== 'number' || adultPrice <= 0)) {
      return NextResponse.json(
        { error: 'Adult price is required and must be greater than zero', field: 'adultPrice' },
        { status: 400 }
      );
    }

    if (childEnabled) {
      if (typeof childPrice !== 'number' || childPrice <= 0) {
        return NextResponse.json(
          { error: 'Child price must be greater than zero', field: 'childPrice' },
          { status: 400 }
        );
      }
      if (childMaxAge <= childMinAge) {
        return NextResponse.json(
          { error: 'Child max age must be greater than min age', field: 'childMaxAge' },
          { status: 400 }
        );
      }
    }

    if (infantEnabled) {
      if (typeof infantPrice !== 'number' || infantPrice <= 0) {
        return NextResponse.json(
          { error: 'Infant price must be greater than zero', field: 'infantPrice' },
          { status: 400 }
        );
      }
      if (infantMaxAge <= infantMinAge) {
        return NextResponse.json(
          { error: 'Infant max age must be greater than min age', field: 'infantMaxAge' },
          { status: 400 }
        );
      }
    }

    let safeTranslations = translations;
    if (!safeTranslations || typeof safeTranslations !== 'object') {
      safeTranslations = {};
    }

    for (const lang of REQUIRED_LANGUAGES) {
      if (!safeTranslations[lang]) {
        safeTranslations[lang] = {
          title: lang === 'en' ? 'Untitled Experience (Draft)' : '',
          description: lang === 'en' ? 'Draft experience description.' : '',
          highlights: [],
          inclusions: [],
          exclusions: [],
          cancellationPolicies: [],
        };
      }
    }

    if (!isDraft) {
      for (const lang of REQUIRED_LANGUAGES) {
        if (!safeTranslations[lang]) {
          return NextResponse.json(
            { error: `Missing translations for ${lang.toUpperCase()}`, field: 'translations' },
            { status: 400 }
          );
        }
      }
    }

    if (safeTranslations) {
      const parsedTranslations = TourTranslationsRecordSchema.safeParse(safeTranslations);
      if (!parsedTranslations.success && !isDraft) {
        return NextResponse.json(
          { error: 'Invalid translations structure', field: 'translations' },
          { status: 400 }
        );
      }
    }

    if (itinerary !== undefined) {
      const parsedItinerary = z.array(ItineraryStepSchema).safeParse(itinerary);
      if (!parsedItinerary.success && !isDraft) {
        return NextResponse.json(
          { error: 'Invalid itinerary data structure', field: 'itinerary' },
          { status: 400 }
        );
      }
    }

    if (reviews !== undefined) {
      const parsedReviews = z.array(SeededReviewSchema).safeParse(reviews);
      if (!parsedReviews.success && !isDraft) {
        return NextResponse.json(
          { error: 'Invalid reviews data structure', field: 'reviews' },
          { status: 400 }
        );
      }
    }

    if (tourOptions !== undefined && Array.isArray(tourOptions)) {
      const parsedAddons = z.array(TourAddonSchema).safeParse(tourOptions);
      if (!parsedAddons.success && !isDraft) {
        return NextResponse.json(
          { error: 'Invalid tourOptions data structure', field: 'tourOptions' },
          { status: 400 }
        );
      }
    }

    if (!isDraft && (!safeTranslations.en.title || safeTranslations.en.title.trim().length === 0)) {
      return NextResponse.json(
        { error: 'English title is required', field: 'translations.en.title' },
        { status: 400 }
      );
    }

    if (!isDraft && (!safeTranslations.en.description || safeTranslations.en.description.trim().length === 0)) {
      return NextResponse.json(
        { error: 'English description is required', field: 'translations.en.description' },
        { status: 400 }
      );
    }

    let resolvedZoneId = zoneId;
    let zoneExists = resolvedZoneId ? await prisma.zone.findUnique({ where: { id: resolvedZoneId } }) : null;
    if (!zoneExists) {
      const fallbackZone = await prisma.zone.findFirst({ orderBy: { name: 'asc' } });
      if (fallbackZone) {
        resolvedZoneId = fallbackZone.id;
        zoneExists = fallbackZone;
      } else {
        return NextResponse.json(
          { error: 'A zone is required before creating tours. Please create a zone first.', field: 'zoneId' },
          { status: 400 }
        );
      }
    }

    const resolvedDestinationId = destinationId
      ?? zoneExists.destinationId
      ?? (await prisma.destination.findFirst({ select: { id: true }, orderBy: { name: 'asc' } }))?.id;

    if (!resolvedDestinationId && !isDraft) {
      return NextResponse.json(
        { error: 'A destination is required before creating tours', field: 'destinationId' },
        { status: 400 }
      );
    }

    if (status === 'ACTIVE') {
      const title = safeTranslations?.en?.title?.trim();
      const price = resolvedAdultPrice || resolvedBasePrice;
      const cover = coverImage?.trim();
      const dest = resolvedDestinationId;

      const missing: string[] = [];
      if (!title || title.startsWith('Untitled Experience')) missing.push('English title');
      if (!price || price <= 0) missing.push('adult price greater than 0');
      if (!cover || !isValidCoverImage(cover)) missing.push('valid cover image asset or storage reference');
      if (!dest) missing.push('destination');

      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot publish tour as active. Missing required fields: ${missing.join(', ')}.`,
            missingFields: missing,
          },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.tour.findUnique({ where: { slug: resolvedSlug } });
    if (existing) {
      if (isDraft) {
        resolvedSlug = `${resolvedSlug}-${Math.random().toString(36).substring(2, 6)}`;
      } else {
        return NextResponse.json(
          { error: 'A tour with this slug already exists', field: 'slug' },
          { status: 409 }
        );
      }
    }

    const tour = await prisma.tour.create({
      data: {
        slug: resolvedSlug,
        type: resolvedType,
        basePriceUSD: resolvedBasePrice,
        durationHours: resolvedDuration,
        maxCapacity: resolvedCapacity,
        destination: resolvedDestinationId ? { connect: { id: resolvedDestinationId } } : undefined,
        zone: { connect: { id: resolvedZoneId } },
        countryCode: countryCode || null,
        region: region || null,
        city: city || null,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        timezone: timezone || null,
        translations: safeTranslations,
        images: [],
        coverImage: coverImage || null,
        galleryImages: galleryImages || [],
        category: category || null,
        status: status || (isDraft ? 'DRAFT' : 'INACTIVE'),
        allowDeposit: allowDeposit ?? false,
        depositPercentage: depositPercentage ?? 100,
        depositType: depositType || 'PERCENTAGE',
        depositAmount: typeof depositAmount === 'number' && depositAmount > 0 ? depositAmount : null,
        allowPayAtLocation: allowPayAtLocation ?? true,
        highlights: highlights || [],
        inclusions: inclusions || [],
        exclusions: exclusions || [],
        itinerary: itinerary || undefined,
        whatToBring: whatToBring || null,
        pickupDescription: pickupDescription || null,
        hotelPickupIncluded: hotelPickupIncluded ?? false,
        pickupTime: pickupTime || null,
        pickupTimes: Array.isArray(pickupTimes) ? pickupTimes : [],
        pickupType: pickupType || 'hotel',
        meetingPointName: meetingPointName || null,
        meetingPointAddress: meetingPointAddress || null,
        meetingPointLat: typeof meetingPointLat === 'number' ? meetingPointLat : null,
        meetingPointLng: typeof meetingPointLng === 'number' ? meetingPointLng : null,
        meetingPointLandmark: meetingPointLandmark || null,
        meetingPointInstructions: meetingPointInstructions || null,
        meetingPointMapUrl: meetingPointMapUrl || null,
        meetingPointImageUrl: meetingPointImageUrl || null,
        cancellationPolicy: cancellationPolicy || null,
        adultPrice: resolvedAdultPrice,
        priceAdult: resolvedAdultPrice,   // keep legacy alias in sync
        originalPrice: typeof originalPrice === 'number' && originalPrice > 0 ? originalPrice : null,
        costPerPerson: typeof costPerPerson === 'number' && costPerPerson > 0 ? costPerPerson : null,
        pricePrivate: typeof privatePrice === 'number' && privatePrice > 0 ? privatePrice : null,
        childPrice: childEnabled ? childPrice : null,
        priceChild: childEnabled ? (childPrice ?? null) : null, // keep legacy alias in sync
        childMinAge: childEnabled ? (childMinAge ?? 3) : null,
        childMaxAge: childEnabled ? (childMaxAge ?? 11) : null,
        infantPrice: infantEnabled ? infantPrice : null,
        infantMinAge: infantEnabled ? (infantMinAge ?? 0) : null,
        infantMaxAge: infantEnabled ? (infantMaxAge ?? 2) : null,
        ageRestrictionsNotes: ageRestrictionsNotes || null,
        cardExcerpt: cardExcerpt || null,
        showExcerptOnCard: showExcerptOnCard ?? true,
        displayExcerpt: displayExcerpt ?? showExcerptOnCard ?? false,
        tourOptions: Array.isArray(tourOptions) ? tourOptions : undefined,
        bookingQuestions: Array.isArray(bookingQuestions) ? bookingQuestions : undefined,
        pickupAreas: Array.isArray(pickupAreas) ? pickupAreas : undefined,
        reviews: Array.isArray(reviews)
          ? reviews.map((review, index) => ({
              id: `seed-${Date.now()}-${index}`,
              customerName: review.customerName || 'Verified Guest',
              rating: Number(review.rating) || 5,
              comment: review.comment || '',
              status: 'APPROVED',
              createdAt: new Date().toISOString(),
            }))
          : undefined,
        ratingAverage: Array.isArray(reviews) && reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 5), 0) / reviews.length
          : undefined,
        ratingCount: Array.isArray(reviews) ? reviews.length : undefined,
        // Badges & Marketing
        isFeatured: isFeatured ?? false,
        isBestSeller: isBestSeller ?? false,
        isRecommended: isRecommended ?? false,
        isVip: isVip ?? false,
        isFamilyFriendly: isFamilyFriendly ?? false,
        isNew: isNew ?? false,
        customBadge: customBadge || null,
        secondaryCategories: Array.isArray(secondaryCategories) ? secondaryCategories : [],
        tags: Array.isArray(tags) ? tags : [],
        // Transport
        vehicleType: vehicleType || null,
        boatType: boatType || null,
        airConditioned: airConditioned ?? false,
        transferNotes: transferNotes || null,
        // Fitness & Accessibility
        fitnessLevel: fitnessLevel || null,
        wheelchairAccessible: wheelchairAccessible ?? false,
        strollerAccessible: strollerAccessible ?? false,
        mobilityNotes: mobilityNotes || null,
        accessibilityNotes: accessibilityNotes || null,
        // Safety
        safetyGuidelines: Array.isArray(safetyGuidelines) ? safetyGuidelines : [],
        insuranceIncluded: insuranceIncluded ?? true,
        emergencyContact: emergencyContact || null,
        freeCancellationHours: typeof freeCancellationHours === 'number' ? freeCancellationHours : 24,
        // Scheduling
        instantConfirmation: instantConfirmation ?? true,
        cutoffHours: typeof cutoffHours === 'number' ? cutoffHours : 12,
        durationDisplay: durationDisplay || null,
        // Route & Activities
        routeStops: Array.isArray(routeStops) ? routeStops : undefined,
        activityTypes: Array.isArray(activityTypes) ? activityTypes : [],
        // Operator
        operatorName: operatorName || null,
        operatorPhone: operatorPhone || null,
        operatorEmail: operatorEmail || null,
        internalNotes: internalNotes || null,
        // Variants
        variants: Array.isArray(variants) ? variants : undefined,
        // SEO
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        keywords: Array.isArray(keywords) ? keywords : [],
      },
      select: {
        id: true,
        slug: true,
        type: true,
        basePriceUSD: true,
        durationHours: true,
        maxCapacity: true,
        zoneId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        tour,
        message: 'Tour created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tour error:', error);
    return NextResponse.json(
      { error: 'Failed to create tour' },
      { status: 500 }
    );
  }
}
