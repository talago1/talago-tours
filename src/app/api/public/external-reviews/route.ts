import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    const where: any = { isActive: true };
    if (entityType) where.entityType = entityType.toUpperCase();
    if (entityId) where.entityId = entityId;

    const profiles = await prisma.externalReviewProfile.findMany({
      where,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      select: {
        id: true,
        platform: true,
        profileUrl: true,
        entityType: true,
        entityName: true,
        rating: true,
        reviewCount: true,
        lastVerifiedAt: true,
      },
    });

    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ profiles: [] }, { status: 500 });
  }
}
