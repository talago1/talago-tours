import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const entityType = searchParams.get('entityType');

    const where: any = {};
    if (platform && platform !== 'ALL') where.platform = platform;
    if (entityType && entityType !== 'ALL') where.entityType = entityType;

    const profiles = await prisma.externalReviewProfile.findMany({
      where,
      orderBy: [{ platform: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ profiles, total: profiles.length });
  } catch (error: any) {
    console.error('[GET /api/admin/external-reviews] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platform,
      profileUrl,
      entityType = 'COMPANY',
      entityId,
      entityName,
      rating,
      reviewCount,
      notes,
    } = body;

    if (!platform || !profileUrl || !entityName || rating === undefined || reviewCount === undefined) {
      return NextResponse.json(
        { error: 'Platform, profileUrl, entityName, rating, and reviewCount are required' },
        { status: 400 }
      );
    }

    const numRating = Math.max(0, Math.min(5, parseFloat(rating) || 5));
    const numReviews = Math.max(0, parseInt(reviewCount, 10) || 0);

    const profile = await prisma.externalReviewProfile.create({
      data: {
        platform: platform.trim(),
        profileUrl: profileUrl.trim(),
        entityType: entityType.toUpperCase(),
        entityId: entityId || null,
        entityName: entityName.trim(),
        rating: numRating,
        reviewCount: numReviews,
        lastVerifiedAt: new Date(),
        syncStatus: 'MANUALLY_VERIFIED',
        notes: notes?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('[POST /api/admin/external-reviews] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create profile' }, { status: 500 });
  }
}
