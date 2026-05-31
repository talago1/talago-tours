import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const ALLOWED_TYPES = ['SHARED', 'PRIVATE'];
const REQUIRED_LANGUAGES = ['en', 'de', 'ru', 'fr', 'it', 'tr'];

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
      highlights,
      inclusions,
      exclusions,
      itinerary,
      whatToBring,
      pickupDescription,
      hotelPickupIncluded,
      adultPrice,
      childEnabled,
      childPrice,
      childMinAge,
      childMaxAge,
      infantEnabled,
      infantPrice,
      infantMinAge,
      infantMaxAge,
      ageRestrictionsNotes,
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
        zoneId,
        translations,
        images: [],
        coverImage: coverImage || null,
        galleryImages: galleryImages || [],
        highlights: highlights || [],
        inclusions: inclusions || [],
        exclusions: exclusions || [],
        itinerary: itinerary || undefined,
        whatToBring: whatToBring || null,
        pickupDescription: pickupDescription || null,
        hotelPickupIncluded: hotelPickupIncluded ?? false,
        adultPrice,
        childPrice: childEnabled ? childPrice : null,
        childMinAge: childEnabled ? (childMinAge ?? 3) : null,
        childMaxAge: childEnabled ? (childMaxAge ?? 11) : null,
        infantPrice: infantEnabled ? infantPrice : null,
        infantMinAge: infantEnabled ? (infantMinAge ?? 0) : null,
        infantMaxAge: infantEnabled ? (infantMaxAge ?? 2) : null,
        ageRestrictionsNotes: ageRestrictionsNotes || null,
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
