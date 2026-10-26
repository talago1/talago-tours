export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizePlain } from '@/utils/sanitize';



export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const lead = await prisma.bookingLead.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            totalPriceUSD: true,
            createdAt: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const ref = `RES-${lead.id.slice(-8).toUpperCase()}`;

    // Find linked live chat conversation if any
    const conversation = await prisma.liveChatConversation.findFirst({
      where: {
        OR: [
          { messages: { some: { body: { contains: ref } } } },
          ...(lead.customerEmail ? [{ visitorEmail: lead.customerEmail }] : []),
          ...(lead.customerPhone ? [{ visitorPhone: lead.customerPhone }] : []),
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({
      lead: {
        ...lead,
        reference: ref,
        conversationId: conversation?.id || null,
        recentMessages: conversation?.messages || [],
      },
    });
  } catch (err: any) {
    console.error('Failed to get lead details:', err);
    return NextResponse.json({ error: 'Failed to get lead details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    // TAL-C8: Explicit transition matrix — keys are current status, values are permitted next statuses.
    // CONVERTED and ABANDONED are terminal; any state may move to ABANDONED (loss / cancellation).
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      INTERESTED:  ['IN_PROGRESS', 'CONTACTED', 'ABANDONED'],
      IN_PROGRESS: ['CONTACTED', 'CONVERTED', 'ABANDONED'],
      CONTACTED:   ['IN_PROGRESS', 'CONVERTED', 'ABANDONED'],
      CONVERTED:   ['ABANDONED'], // only terminal escape
      ABANDONED:   [],            // true terminal — no exits
    };

    const updateData: Partial<Record<string, unknown>> = {};

    if (body.status) {
      // Fetch current status to validate the transition
      const current = await prisma.bookingLead.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) {
        return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
      }

      const permitted = ALLOWED_TRANSITIONS[current.status] ?? [];
      if (!permitted.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from ${current.status} to ${body.status}. Permitted next states: ${permitted.length ? permitted.join(', ') : 'none (terminal state)'}`,
          },
          { status: 400 }
        );
      }
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
  } catch (err: unknown) {
    console.error('Failed to update lead:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
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
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
