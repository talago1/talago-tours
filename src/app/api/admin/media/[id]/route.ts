import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DeleteResponse, ErrorResponse } from '@/types/media';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteResponse | ErrorResponse>> {
  try {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: params.id },
      select: { id: true, tourId: true, displayOrder: true },
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.delete({ where: { id: params.id } });

      const remaining = await tx.mediaAsset.findMany({
        where: { tourId: asset.tourId },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, displayOrder: true },
      });

      await Promise.all(
        remaining.map((r, index) =>
          tx.mediaAsset.update({
            where: { id: r.id },
            data: { displayOrder: index },
          })
        )
      );
    });

    const remainingCount = await prisma.mediaAsset.count({
      where: { tourId: asset.tourId },
    });

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
      tourId: asset.tourId,
      remainingCount,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }
}
