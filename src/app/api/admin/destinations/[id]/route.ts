import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const existing = await prisma.destination.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
    }

    const destination = await prisma.destination.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.translations !== undefined && { translations: body.translations }),
        ...(body.countryCode !== undefined && { countryCode: body.countryCode }),
        ...(body.region !== undefined && { region: body.region || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.latitude !== undefined && { latitude: typeof body.latitude === 'number' ? body.latitude : null }),
        ...(body.longitude !== undefined && { longitude: typeof body.longitude === 'number' ? body.longitude : null }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
      },
      include: {
        _count: { select: { tours: true } },
        zones: true,
      },
    });

    return NextResponse.json(destination);
  } catch {
    return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const existing = await prisma.destination.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
    }

    await prisma.destination.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 });
  }
}
