import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ReorderPayload, ReorderResponse, ErrorResponse } from '@/types/media';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ReorderResponse | ErrorResponse>> {
  try {
    const body: ReorderPayload = await request.json();
    const { tourId, orderedAssetIds } = body;

    if (!tourId || typeof tourId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'tourId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(orderedAssetIds) || orderedAssetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderedAssetIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const existingAssets = await prisma.mediaAsset.findMany({
      where: { tourId },
      select: { id: true },
    });

    const existingIds = new Set(existingAssets.map((a) => a.id));
    const allBelong = orderedAssetIds.every((id) => existingIds.has(id));

    if (!allBelong || orderedAssetIds.length !== existingAssets.length) {
      return NextResponse.json(
        { success: false, error: 'orderedAssetIds must belong to the specified tour' },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(
      orderedAssetIds.map((id, index) =>
        prisma.mediaAsset.update({
          where: { id },
          data: { displayOrder: index },
          select: { id: true, displayOrder: true },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Reorder successful',
      assets: updated,
    });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json(
      { success: false, error: 'Reorder failed' },
      { status: 500 }
    );
  }
}
