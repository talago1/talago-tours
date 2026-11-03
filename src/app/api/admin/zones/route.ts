import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { name: 'asc' },
      include: {
        destination: { select: { id: true, name: true } },
        _count: { select: { tours: true } },
      },
    });
    return NextResponse.json({ zones, total: zones.length });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, transferFee, pickupOffset, destinationId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 },
      );
    }

    const zone = await prisma.zone.create({
      data: {
        name: name.trim(),
        transferFee: typeof transferFee === 'number' ? transferFee : 0,
        pickupOffset: typeof pickupOffset === 'number' ? pickupOffset : 0,
        destinationId: destinationId || undefined,
      },
      include: {
        destination: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A zone with this name already exists' },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, transferFee, pickupOffset, destinationId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Zone ID is required' },
        { status: 400 },
      );
    }

    const existing = await prisma.zone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 },
      );
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (transferFee !== undefined) data.transferFee = transferFee;
    if (pickupOffset !== undefined) data.pickupOffset = pickupOffset;
    if (destinationId !== undefined) data.destinationId = destinationId || null;

    const updated = await prisma.zone.update({
      where: { id },
      data,
      include: {
        destination: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A zone with this name already exists' },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Zone ID is required' },
        { status: 400 },
      );
    }

    const existing = await prisma.zone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 },
      );
    }

    const force = searchParams.get('force') === 'true';

    const [tourCount, bookingCount] = await Promise.all([
      prisma.tour.count({ where: { zoneId: id } }),
      prisma.booking.count({ where: { zoneId: id } }),
    ]);

    if ((tourCount > 0 || bookingCount > 0) && !force) {
      return NextResponse.json(
        {
          requiresForce: true,
          tourCount,
          bookingCount,
          message: `Zone '${existing.name}' is referenced by ${tourCount} tour(s) and ${bookingCount} booking(s). Deleting will unlink them.`,
        },
        { status: 409 },
      );
    }

    if (tourCount > 0) {
      await prisma.tour.updateMany({ where: { zoneId: id }, data: { zoneId: null } });
    }
    if (bookingCount > 0) {
      await prisma.booking.updateMany({ where: { zoneId: id }, data: { zoneId: null } });
    }

    await prisma.zone.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Zone deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 },
    );
  }
}
