import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const existing = await prisma.externalReviewProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'External review profile not found' }, { status: 404 });
    }

    const data: any = {};
    if (body.platform !== undefined) data.platform = body.platform.trim();
    if (body.profileUrl !== undefined) data.profileUrl = body.profileUrl.trim();
    if (body.entityType !== undefined) data.entityType = body.entityType.toUpperCase();
    if (body.entityId !== undefined) data.entityId = body.entityId || null;
    if (body.entityName !== undefined) data.entityName = body.entityName.trim();
    if (body.rating !== undefined) {
      data.rating = Math.max(0, Math.min(5, parseFloat(body.rating) || 5));
    }
    if (body.reviewCount !== undefined) {
      data.reviewCount = Math.max(0, parseInt(body.reviewCount, 10) || 0);
    }
    if (body.syncStatus !== undefined) data.syncStatus = body.syncStatus;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.verifiedNow) data.lastVerifiedAt = new Date();

    const updated = await prisma.externalReviewProfile.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('[PATCH /api/admin/external-reviews/[id]] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const existing = await prisma.externalReviewProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'External review profile not found' }, { status: 404 });
    }

    await prisma.externalReviewProfile.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('[DELETE /api/admin/external-reviews/[id]] error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete profile' }, { status: 500 });
  }
}
