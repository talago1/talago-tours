import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TourTranslationsRecordSchema, ItineraryStepSchema, SeededReviewSchema, TourAddonSchema } from '@/utils/tourJsonSchemas';
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
      privatePrice,
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
      depositType,
      depositAmount,
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
      updateData.priceAdult = numAdult; // keep legacy alias in sync
      updateData.basePrice = numAdult;  // catalog legacy sync
    }

    if (originalPrice !== undefined) {
      updateData.originalPrice = originalPrice !== null && Number(originalPrice) > 0 ? Number(originalPrice) : null;
    }

    if (privatePrice !== undefined) {
      updateData.pricePrivate = privatePrice !== null && Number(privatePrice) > 0 ? Number(privatePrice) : null;
    }

    if (childPrice !== undefined) {
      updateData.childPrice = childPrice !== null ? Number(childPrice) : null;
      updateData.priceChild = childPrice !== null ? Number(childPrice) : null; // keep legacy alias in sync
    }
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
    if (depositType !== undefined) updateData.depositType = depositType === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    if (depositAmount !== undefined) updateData.depositAmount = typeof depositAmount === 'number' && depositAmount > 0 ? depositAmount : null;
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
    if (pickupType !== undefined) updateData.pickupType = pickupType;
    if (meetingPointName !== undefined) updateData.meetingPointName = meetingPointName || null;
    if (meetingPointAddress !== undefined) updateData.meetingPointAddress = meetingPointAddress || null;
    if (meetingPointLat !== undefined) updateData.meetingPointLat = typeof meetingPointLat === 'number' ? meetingPointLat : null;
    if (meetingPointLng !== undefined) updateData.meetingPointLng = typeof meetingPointLng === 'number' ? meetingPointLng : null;
    if (meetingPointLandmark !== undefined) updateData.meetingPointLandmark = meetingPointLandmark || null;
    if (meetingPointInstructions !== undefined) updateData.meetingPointInstructions = meetingPointInstructions || null;
    if (meetingPointMapUrl !== undefined) updateData.meetingPointMapUrl = meetingPointMapUrl || null;
    if (meetingPointImageUrl !== undefined) updateData.meetingPointImageUrl = meetingPointImageUrl || null;
    if (cancellationPolicy !== undefined) updateData.cancellationPolicy = cancellationPolicy;
    if (tourOptions !== undefined) {
      if (tourOptions === null || !Array.isArray(tourOptions)) {
        updateData.tourOptions = null;
      } else {
        const parsedAddons = z.array(TourAddonSchema).safeParse(tourOptions);
        if (!parsedAddons.success) {
          console.error('TourOptions Zod Error:', JSON.stringify(parsedAddons.error.issues, null, 2));
          return NextResponse.json({
            error: 'Invalid tourOptions data structure',
            field: 'tourOptions',
            details: parsedAddons.error.issues,
          }, { status: 400 });
        }
        updateData.tourOptions = tourOptions;
      }
    }

    if (bookingQuestions !== undefined) {
      updateData.bookingQuestions = Array.isArray(bookingQuestions) ? bookingQuestions : [];
    }

    if (countryCode !== undefined) updateData.countryCode = countryCode || null;
    if (region !== undefined) updateData.region = region || null;
    if (city !== undefined) updateData.city = city || null;
    if (latitude !== undefined) updateData.latitude = typeof latitude === 'number' ? latitude : null;
    if (longitude !== undefined) updateData.longitude = typeof longitude === 'number' ? longitude : null;
    if (timezone !== undefined) updateData.timezone = timezone || null;

    // Badges & Marketing
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isBestSeller !== undefined) updateData.isBestSeller = Boolean(isBestSeller);
    if (isRecommended !== undefined) updateData.isRecommended = Boolean(isRecommended);
    if (isVip !== undefined) updateData.isVip = Boolean(isVip);
    if (isFamilyFriendly !== undefined) updateData.isFamilyFriendly = Boolean(isFamilyFriendly);
    if (isNew !== undefined) updateData.isNew = Boolean(isNew);
    if (customBadge !== undefined) updateData.customBadge = customBadge || null;
    if (secondaryCategories !== undefined) updateData.secondaryCategories = Array.isArray(secondaryCategories) ? secondaryCategories : [];
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

    // Transport
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType || null;
    if (boatType !== undefined) updateData.boatType = boatType || null;
    if (airConditioned !== undefined) updateData.airConditioned = Boolean(airConditioned);
    if (transferNotes !== undefined) updateData.transferNotes = transferNotes || null;

    // Fitness & Accessibility
    if (fitnessLevel !== undefined) updateData.fitnessLevel = fitnessLevel || null;
    if (wheelchairAccessible !== undefined) updateData.wheelchairAccessible = Boolean(wheelchairAccessible);
    if (strollerAccessible !== undefined) updateData.strollerAccessible = Boolean(strollerAccessible);
    if (mobilityNotes !== undefined) updateData.mobilityNotes = mobilityNotes || null;
    if (accessibilityNotes !== undefined) updateData.accessibilityNotes = accessibilityNotes || null;

    // Safety
    if (safetyGuidelines !== undefined) updateData.safetyGuidelines = Array.isArray(safetyGuidelines) ? safetyGuidelines : [];
    if (insuranceIncluded !== undefined) updateData.insuranceIncluded = Boolean(insuranceIncluded);
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact || null;
    if (freeCancellationHours !== undefined) updateData.freeCancellationHours = Number(freeCancellationHours) || 24;

    // Scheduling
    if (instantConfirmation !== undefined) updateData.instantConfirmation = Boolean(instantConfirmation);
    if (cutoffHours !== undefined) updateData.cutoffHours = Number(cutoffHours) || 12;
    if (durationDisplay !== undefined) updateData.durationDisplay = durationDisplay || null;

    // Route & Activities
    if (routeStops !== undefined) updateData.routeStops = Array.isArray(routeStops) ? routeStops : null;
    if (activityTypes !== undefined) updateData.activityTypes = Array.isArray(activityTypes) ? activityTypes : [];

    // Operator
    if (operatorName !== undefined) updateData.operatorName = operatorName || null;
    if (operatorPhone !== undefined) updateData.operatorPhone = operatorPhone || null;
    if (operatorEmail !== undefined) updateData.operatorEmail = operatorEmail || null;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes || null;

    // Variants
    if (variants !== undefined) updateData.variants = Array.isArray(variants) ? variants : null;

    // SEO
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
    if (keywords !== undefined) updateData.keywords = Array.isArray(keywords) ? keywords : [];

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
    if (body.isFeatured !== undefined) {
      updateData.isFeatured = Boolean(body.isFeatured);
    }
    if (body.isBestSeller !== undefined) {
      updateData.isBestSeller = Boolean(body.isBestSeller);
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
