import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tours = await prisma.tour.findMany({
      select: {
        id: true,
        slug: true,
        translations: true,
        adultPrice: true,
        childPrice: true,
        childMinAge: true,
        childMaxAge: true,
        infantPrice: true,
        infantMinAge: true,
        infantMaxAge: true,
        ageRestrictionsNotes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tours });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, pricing } = body;

    if (!tourId || !pricing) {
      return NextResponse.json(
        { error: 'tourId and pricing are required' },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};

    if (pricing.childPrice !== undefined) data.childPrice = pricing.childPrice;
    if (pricing.childMinAge !== undefined) data.childMinAge = pricing.childMinAge;
    if (pricing.childMaxAge !== undefined) data.childMaxAge = pricing.childMaxAge;
    if (pricing.infantPrice !== undefined) data.infantPrice = pricing.infantPrice;
    if (pricing.infantMinAge !== undefined) data.infantMinAge = pricing.infantMinAge;
    if (pricing.infantMaxAge !== undefined) data.infantMaxAge = pricing.infantMaxAge;
    if (pricing.ageRestrictionsNotes !== undefined) data.ageRestrictionsNotes = pricing.ageRestrictionsNotes;

    const tour = await prisma.tour.update({
      where: { id: tourId },
      data,
      select: {
        id: true,
        slug: true,
        translations: true,
        adultPrice: true,
        childPrice: true,
        childMinAge: true,
        childMaxAge: true,
        infantPrice: true,
        infantMinAge: true,
        infantMaxAge: true,
        ageRestrictionsNotes: true,
      },
    });

    return NextResponse.json({ tour, message: 'Pricing updated' });
  } catch {
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
  }
}
