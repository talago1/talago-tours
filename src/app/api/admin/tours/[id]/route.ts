import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
      if (typeof basePriceUSD !== 'number' || basePriceUSD <= 0) {
        return NextResponse.json({ error: 'Base price must be positive' }, { status: 400 });
      }
      updateData.basePriceUSD = basePriceUSD;
    }

    if (durationHours !== undefined) {
      if (!Number.isInteger(durationHours) || durationHours <= 0) {
        return NextResponse.json({ error: 'Duration must be a positive integer' }, { status: 400 });
      }
      updateData.durationHours = durationHours;
    }

    if (maxCapacity !== undefined) {
      if (!Number.isInteger(maxCapacity) || maxCapacity <= 0) {
        return NextResponse.json({ error: 'Max capacity must be a positive integer' }, { status: 400 });
      }
      updateData.maxCapacity = maxCapacity;
    }

    if (zoneId !== undefined) {
      const zoneExists = await prisma.zone.findUnique({ where: { id: zoneId } });
      if (!zoneExists) {
        return NextResponse.json({ error: 'Selected zone does not exist' }, { status: 400 });
      }
      updateData.zoneId = zoneId;
    }

    if (destinationId !== undefined) {
      const destinationExists = await prisma.destination.findUnique({ where: { id: destinationId } });
      if (!destinationExists) {
        return NextResponse.json({ error: 'Selected destination does not exist' }, { status: 400 });
      }
      updateData.destinationId = destinationId;
    }

    if (translations !== undefined) {
      updateData.translations = translations;
    }

    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (galleryImages !== undefined) updateData.galleryImages = galleryImages.filter(Boolean);
    if (highlights !== undefined) updateData.highlights = highlights;
    if (inclusions !== undefined) updateData.inclusions = inclusions;
    if (exclusions !== undefined) updateData.exclusions = exclusions;

    if (adultPrice !== undefined) {
      if (typeof adultPrice !== 'number' || adultPrice <= 0) {
        return NextResponse.json({ error: 'Adult price must be positive' }, { status: 400 });
      }
      updateData.adultPrice = adultPrice;
      updateData.basePrice = new Prisma.Decimal(adultPrice); // Catalog legacy sync
    }

    if (childPrice !== undefined) updateData.childPrice = childPrice;
    if (childMinAge !== undefined) updateData.childMinAge = childMinAge;
    if (childMaxAge !== undefined) updateData.childMaxAge = childMaxAge;
    if (infantPrice !== undefined) updateData.infantPrice = infantPrice;
    if (infantMinAge !== undefined) updateData.infantMinAge = infantMinAge;
    if (infantMaxAge !== undefined) updateData.infantMaxAge = infantMaxAge;
    if (ageRestrictionsNotes !== undefined) updateData.ageRestrictionsNotes = ageRestrictionsNotes;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (allowDeposit !== undefined) updateData.allowDeposit = allowDeposit;
    if (depositPercentage !== undefined) updateData.depositPercentage = depositPercentage;
    if (allowPayAtLocation !== undefined) updateData.allowPayAtLocation = allowPayAtLocation;

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.tour.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Check if there are active bookings
    const bookingsCount = await prisma.booking.count({
      where: { tourId: params.id },
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tour because it has active bookings. Archive it instead.' },
        { status: 400 }
      );
    }

    await prisma.tour.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    console.error('Delete tour error:', error);
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
  }
}
