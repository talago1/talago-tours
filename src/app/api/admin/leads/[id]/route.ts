export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizePlain } from '@/utils/sanitize';

type LeadStatusInput = 'INTERESTED' | 'IN_PROGRESS' | 'CONTACTED' | 'CONVERTED' | 'ABANDONED';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    const allowedStatuses: LeadStatusInput[] = ['INTERESTED', 'IN_PROGRESS', 'CONTACTED', 'CONVERTED', 'ABANDONED'];
    const updateData: any = {};

    if (body.status && allowedStatuses.includes(body.status)) {
      updateData.status = body.status;
    }

    if (typeof body.notes === 'string') {
      updateData.notes = sanitizePlain(body.notes, 1000);
    }

    if (body.bookingId) {
      updateData.bookingId = sanitizePlain(body.bookingId, 50);
      // A manual link alone is not proof that payment or confirmation completed.
      updateData.status = body.status === 'CONVERTED' ? 'CONVERTED' : 'IN_PROGRESS';
    }

    updateData.updatedAt = new Date();

    const updated = await prisma.bookingLead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    console.error('Failed to update lead:', err);
    return NextResponse.json({ error: 'Failed to update lead', details: err?.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    await prisma.bookingLead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete lead:', err);
    return NextResponse.json({ error: 'Failed to delete lead', details: err?.message }, { status: 500 });
  }
}
