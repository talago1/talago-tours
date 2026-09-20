import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TourTranslationsRecordSchema, ItineraryStepSchema, SeededReviewSchema } from '@/utils/tourJsonSchemas';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const ALLOWED_TYPES = ['SHARED', 'PRIVATE'];
const REQUIRED_LANGUAGES = ['en', 'de', 'ru', 'fr', 'it', 'pl', 'es'];

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
      cancellationPolicy,
      adultPrice,
      originalPrice,
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
    } = body;

    if (!slug || !type || basePriceUSD === undefined || durationHours === undefined || maxCapacity === undefined || !zoneId || !translations) {
      return NextResponse.json(
        { error: 'Missing required fields', field: '' },
        { status: 400 }
      );
    }

    if (!SLUG_REGEX.test(slug) || slug.length > 200) {
      return NextResponse.json(
        { error: 'Slug must be URL-safe (lowercase, numbers, hyphens) and under 200 characters', field: 'slug' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Tour type must be SHARED or PRIVATE', field: 'type' },
        { status: 400 }
      );
    }

    if (typeof basePriceUSD !== 'number' || basePriceUSD <= 0) {
      return NextResponse.json(
        { error: 'Base price must be a positive number', field: 'basePriceUSD' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(durationHours) || durationHours <= 0) {
      return NextResponse.json(
        { error: 'Duration must be a positive whole number', field: 'durationHours' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(maxCapacity) || maxCapacity <= 0) {
      return NextResponse.json(
        { error: 'Max capacity must be a positive whole number', field: 'maxCapacity' },
        { status: 400 }
      );
    }

    // Pricing validation
    if (typeof adultPrice !== 'number' || adultPrice <= 0) {
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

    for (const lang of REQUIRED_LANGUAGES) {
      if (!translations[lang]) {
        return NextResponse.json(
          { error: `Missing translations for ${lang.toUpperCase()}`, field: 'translations' },
          { status: 400 }
        );
      }
    }

    if (translations) {
      const parsedTranslations = TourTranslationsRecordSchema.safeParse(translations);
      if (!parsedTranslations.success) {
        return NextResponse.json(
          { error: 'Invalid translations structure', field: 'translations' },
          { status: 400 }
        );
      }
    }

    if (itinerary !== undefined) {
      const parsedItinerary = z.array(ItineraryStepSchema).safeParse(itinerary);
      if (!parsedItinerary.success) {
        return NextResponse.json(
          { error: 'Invalid itinerary data structure', field: 'itinerary' },
          { status: 400 }
        );
      }
    }

    if (reviews !== undefined) {
      const parsedReviews = z.array(SeededReviewSchema).safeParse(reviews);
      if (!parsedReviews.success) {
        return NextResponse.json(
          { error: 'Invalid reviews data structure', field: 'reviews' },
          { status: 400 }
        );
      }
    }

    if (!translations.en.title || translations.en.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'English title is required', field: 'translations.en.title' },
        { status: 400 }
      );
    }

    if (!translations.en.description || translations.en.description.trim().length === 0) {
      return NextResponse.json(
        { error: 'English description is required', field: 'translations.en.description' },
        { status: 400 }
      );
    }

    const zoneExists = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zoneExists) {
      return NextResponse.json(
        { error: 'Selected zone does not exist', field: 'zoneId' },
        { status: 400 }
      );
    }

    const resolvedDestinationId = destinationId
      ?? zoneExists.destinationId
      ?? (await prisma.destination.findFirst({ select: { id: true }, orderBy: { name: 'asc' } }))?.id;

    if (!resolvedDestinationId) {
      return NextResponse.json(
        { error: 'A destination is required before creating tours', field: 'destinationId' },
        { status: 400 }
      );
    }

    const existing = await prisma.tour.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A tour with this slug already exists', field: 'slug' },
        { status: 409 }
      );
    }

    const tour = await prisma.tour.create({
      data: {
        slug,
        type,
        basePriceUSD,
        durationHours,
        maxCapacity,
        destination: { connect: { id: resolvedDestinationId } },
        zone: { connect: { id: zoneId } },
        translations,
        images: [],
        coverImage: coverImage || null,
        galleryImages: galleryImages || [],
        category: category || null,
        status: status || 'INACTIVE',
        allowDeposit: allowDeposit ?? false,
        depositPercentage: depositPercentage ?? 100,
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
        cancellationPolicy: cancellationPolicy || null,
        adultPrice,
        originalPrice: typeof originalPrice === 'number' && originalPrice > 0 ? originalPrice : null,
        childPrice: childEnabled ? childPrice : null,
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
