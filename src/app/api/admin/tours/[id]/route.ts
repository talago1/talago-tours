import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TourTranslationsRecordSchema, ItineraryStepSchema, SeededReviewSchema } from '@/utils/tourJsonSchemas';
const SLUG_REGEX = /^[a-z0-9-]+$/;
const ALLOWED_TYPES = ['SHARED', 'PRIVATE'];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { id: params.id },
      include: { destination: { select: { name: true } } },
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json(tour);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.tour.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await request.json();

    const {
      slug,
      type,
      basePriceUSD,
      durationHours,
      maxCapacity,
      zoneId,
      destinationId,
      translations,
      coverImage,
      galleryImages,
      highlights,
      inclusions,
      exclusions,
      adultPrice,
      originalPrice,
      childPrice,
      childMinAge,
      childMaxAge,
      infantPrice,
      infantMinAge,
      infantMaxAge,
      ageRestrictionsNotes,
      status,
      category,
      allowDeposit,
      depositPercentage,
      allowPayAtLocation,
      itinerary,
      cardExcerpt,
      showExcerptOnCard,
      displayExcerpt,
      whatToBring,
      pickupDescription,
      hotelPickupIncluded,
      pickupTime,
      pickupTimes,
      cancellationPolicy,
      reviews,
      tourOptions,
    } = body;

    // Build update payload
    const updateData: any = {};

    if (slug !== undefined) {
      if (!SLUG_REGEX.test(slug) || slug.length > 200) {
        return NextResponse.json(
          { error: 'Slug must be URL-safe and under 200 characters', field: 'slug' },
          { status: 400 }
        );
      }
      // Check slug collision
      const collision = await prisma.tour.findFirst({
        where: { slug, id: { not: params.id } },
      });
      if (collision) {
        return NextResponse.json(
          { error: 'A tour with this slug already exists', field: 'slug' },
          { status: 409 }
        );
      }
      updateData.slug = slug;
    }

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Tour type must be SHARED or PRIVATE' }, { status: 400 });
      }
      updateData.type = type;
    }

    if (basePriceUSD !== undefined) {
      const numBase = Number(basePriceUSD);
      if (isNaN(numBase) || numBase <= 0) {
        return NextResponse.json({ error: 'Base price must be a positive number', field: 'basePriceUSD' }, { status: 400 });
      }
      updateData.basePriceUSD = numBase;
    }

    if (durationHours !== undefined) {
      const numDuration = Number(durationHours);
      if (isNaN(numDuration) || numDuration <= 0) {
        return NextResponse.json({ error: 'Duration must be a positive number', field: 'durationHours' }, { status: 400 });
      }
      updateData.durationHours = numDuration;
    }

    if (maxCapacity !== undefined) {
      const numCapacity = Number(maxCapacity);
      if (isNaN(numCapacity) || numCapacity <= 0) {
        return NextResponse.json({ error: 'Max capacity must be a positive number', field: 'maxCapacity' }, { status: 400 });
      }
      updateData.maxCapacity = numCapacity;
    }

    if (zoneId !== undefined) {
      const zoneExists = await prisma.zone.findUnique({ where: { id: zoneId } });
      if (!zoneExists) {
        return NextResponse.json({ error: 'Selected zone does not exist', field: 'zoneId' }, { status: 400 });
      }
      updateData.zoneId = zoneId;
    }

    if (destinationId !== undefined) {
      const destinationExists = await prisma.destination.findUnique({ where: { id: destinationId } });
      if (!destinationExists) {
        return NextResponse.json({ error: 'Selected destination does not exist', field: 'destinationId' }, { status: 400 });
      }
      updateData.destinationId = destinationId;
    }

    if (translations !== undefined) {
      const parsedTranslations = TourTranslationsRecordSchema.safeParse(translations);
      if (!parsedTranslations.success) {
        console.error('Translations Zod Error:', JSON.stringify(parsedTranslations.error.issues, null, 2));
        return NextResponse.json({
          error: 'Invalid translations structure',
          field: 'translations',
          details: parsedTranslations.error.issues,
        }, { status: 400 });
      }
      updateData.translations = translations;
    }

    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (galleryImages !== undefined) updateData.galleryImages = Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : [];
    if (highlights !== undefined) updateData.highlights = highlights;
    if (inclusions !== undefined) updateData.inclusions = inclusions;
    if (exclusions !== undefined) updateData.exclusions = exclusions;

    if (adultPrice !== undefined) {
      const numAdult = Number(adultPrice);
      if (isNaN(numAdult) || numAdult <= 0) {
        return NextResponse.json({ error: 'Adult price must be a positive number', field: 'adultPrice' }, { status: 400 });
      }
      updateData.adultPrice = numAdult;
      updateData.basePrice = numAdult; // Catalog legacy sync
    }

    if (originalPrice !== undefined) {
      updateData.originalPrice = originalPrice !== null && Number(originalPrice) > 0 ? Number(originalPrice) : null;
    }

    if (childPrice !== undefined) updateData.childPrice = childPrice !== null ? Number(childPrice) : null;
    if (childMinAge !== undefined) updateData.childMinAge = childMinAge !== null ? Number(childMinAge) : null;
    if (childMaxAge !== undefined) updateData.childMaxAge = childMaxAge !== null ? Number(childMaxAge) : null;
    if (infantPrice !== undefined) updateData.infantPrice = infantPrice !== null ? Number(infantPrice) : null;
    if (infantMinAge !== undefined) updateData.infantMinAge = infantMinAge !== null ? Number(infantMinAge) : null;
    if (infantMaxAge !== undefined) updateData.infantMaxAge = infantMaxAge !== null ? Number(infantMaxAge) : null;
    if (ageRestrictionsNotes !== undefined) updateData.ageRestrictionsNotes = ageRestrictionsNotes;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (allowDeposit !== undefined) updateData.allowDeposit = allowDeposit;
    if (depositPercentage !== undefined) updateData.depositPercentage = depositPercentage !== null ? Number(depositPercentage) : 100;
    if (allowPayAtLocation !== undefined) updateData.allowPayAtLocation = allowPayAtLocation;

    if (itinerary !== undefined) {
      if (itinerary === null) {
        updateData.itinerary = null;
      } else if (Array.isArray(itinerary)) {
        const parsedItinerary = z.array(ItineraryStepSchema).safeParse(itinerary);
        if (!parsedItinerary.success) {
          console.error('Itinerary Zod Error:', JSON.stringify(parsedItinerary.error.issues, null, 2));
          return NextResponse.json({
            error: 'Invalid itinerary data structure',
            field: 'itinerary',
            details: parsedItinerary.error.issues,
          }, { status: 400 });
        }
        updateData.itinerary = itinerary;
      } else {
        updateData.itinerary = itinerary;
      }
    }
    if (cardExcerpt !== undefined) updateData.cardExcerpt = cardExcerpt;
    if (showExcerptOnCard !== undefined) updateData.showExcerptOnCard = showExcerptOnCard;
    if (displayExcerpt !== undefined) updateData.displayExcerpt = displayExcerpt;
    if (whatToBring !== undefined) updateData.whatToBring = whatToBring;
    if (pickupDescription !== undefined) updateData.pickupDescription = pickupDescription;
    if (hotelPickupIncluded !== undefined) updateData.hotelPickupIncluded = hotelPickupIncluded;
    if (pickupTime !== undefined) updateData.pickupTime = pickupTime;
    if (pickupTimes !== undefined) updateData.pickupTimes = Array.isArray(pickupTimes) ? pickupTimes : [];
    if (cancellationPolicy !== undefined) updateData.cancellationPolicy = cancellationPolicy;
    if (tourOptions !== undefined) updateData.tourOptions = Array.isArray(tourOptions) ? tourOptions : null;

    if (reviews !== undefined && reviews !== null) {
      if (Array.isArray(reviews)) {
        const parsedReviews = z.array(SeededReviewSchema).safeParse(reviews);
        if (!parsedReviews.success) {
          console.error('Reviews Zod Error:', JSON.stringify(parsedReviews.error.issues, null, 2));
          return NextResponse.json({
            error: 'Invalid reviews data structure',
            field: 'reviews',
            details: parsedReviews.error.issues,
          }, { status: 400 });
        }
        updateData.reviews = reviews.map((review: any, index: number) => ({
          id: review.id || `seed-${Date.now()}-${index}`,
          customerName: review.customerName || 'Verified Guest',
          rating: Number(review.rating) || 5,
          comment: review.comment || '',
          status: review.status || 'APPROVED',
          createdAt: review.createdAt || new Date().toISOString(),
        }));
        if (reviews.length > 0) {
          updateData.ratingAverage = reviews.reduce((sum: number, review: any) => sum + (Number(review.rating) || 5), 0) / reviews.length;
          updateData.ratingCount = reviews.length;
        }
      } else {
        updateData.reviews = reviews;
      }
    }


    const tour = await prisma.tour.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ tour, message: 'Tour updated successfully' });
  } catch (error) {
    console.error('Update tour error:', error);
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.tour.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.category !== undefined) {
      updateData.category = body.category;
    }
    if (body.originalPrice !== undefined) {
      updateData.originalPrice = body.originalPrice;
    }

    const tour = await prisma.tour.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ tour, message: 'Tour updated successfully' });
  } catch (error) {
    console.error('Patch tour error:', error);
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.tour.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const force = url.searchParams.get('force') === 'true';

    // 1. Archive/Deactivate option
    if (action === 'archive' || action === 'deactivate') {
      const tour = await prisma.tour.update({
        where: { id: params.id },
        data: { status: 'INACTIVE' },
      });
      return NextResponse.json({
        message: 'Tour deactivated successfully and hidden from public catalog',
        status: 'INACTIVE',
        tour,
      });
    }

    // Check if there are active bookings
    const bookingsCount = await prisma.booking.count({
      where: { tourId: params.id },
    });

    // 2. If tour has bookings and not forced, ask user with options
    if (bookingsCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete tour directly because it has ${bookingsCount} active booking(s). Archive it to hide from public or confirm force delete to remove all bookings.`,
          bookingsCount,
          hasBookings: true,
        },
        { status: 400 }
      );
    }

    // 3. Force cascade delete (or normal delete if no bookings)
    await prisma.$transaction(async (tx) => {
      if (bookingsCount > 0) {
        // Delete related transactions
        await tx.transaction.deleteMany({
          where: { booking: { tourId: params.id } },
        });
        // Delete bookings
        await tx.booking.deleteMany({
          where: { tourId: params.id },
        });
      }

      // Delete reviews
      await tx.review.deleteMany({
        where: { tourId: params.id },
      });

      // Delete time slots
      await tx.tourTimeSlot.deleteMany({
        where: { tourId: params.id },
      });

      // Delete media assets
      await tx.mediaAsset.deleteMany({
        where: { tourId: params.id },
      });

      // Delete the tour
      await tx.tour.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      message: bookingsCount > 0
        ? `Tour and its ${bookingsCount} associated booking(s) deleted successfully`
        : 'Tour deleted successfully',
      deletedBookingsCount: bookingsCount,
    });
  } catch (error) {
    console.error('Delete tour error:', error);
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}
