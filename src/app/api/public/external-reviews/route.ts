import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const getCachedExternalReviews = unstable_cache(
  async (entityType: string | null, entityId: string | null) => {
    const where: Record<string, unknown> = { isActive: true };
    if (entityType) where.entityType = entityType.toUpperCase();
    if (entityId) where.entityId = entityId;

    return prisma.externalReviewProfile.findMany({
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
  },
  ['public-external-reviews-v1'],
  { revalidate: 300, tags: ['reviews', 'external-reviews'] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    const profiles = await getCachedExternalReviews(entityType, entityId);

    return NextResponse.json(
      { profiles },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json({ profiles: [] }, { status: 500 });
  }
}
