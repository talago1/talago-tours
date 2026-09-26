import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const destinations = await prisma.destination.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { tours: true } },
        zones: true,
      },
    });
    return NextResponse.json({ destinations, total: destinations.length });
  } catch {
    return NextResponse.json({ destinations: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, imageUrl, translations, countryCode, region, city, latitude, longitude, timezone } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

    const destination = await prisma.destination.create({
      data: {
        name,
        slug: finalSlug,
        description: description || '',
        imageUrl: imageUrl || null,
        translations: translations || '{}',
        countryCode: countryCode || 'EG',
        region: region || null,
        city: city || null,
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        timezone: timezone || 'Africa/Cairo',
      },
      include: {
        _count: { select: { tours: true } },
        zones: true,
      },
    });

    return NextResponse.json(destination, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
  }
}
