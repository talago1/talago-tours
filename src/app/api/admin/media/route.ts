import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tourId = searchParams.get('tourId');

  if (!tourId) {
    return NextResponse.json(
      { error: 'tourId query parameter is required' },
      { status: 400 }
    );
  }

  const assets = await prisma.mediaAsset.findMany({
    where: { tourId },
    orderBy: { displayOrder: 'asc' },
  });

  return NextResponse.json(assets);
}
