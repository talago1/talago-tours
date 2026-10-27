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

    const isInquiry = lead.source === 'INQUIRY';
    const ref = isInquiry
      ? `INQ-${lead.id.slice(-8).toUpperCase()}`
      : `RES-${lead.id.slice(-8).toUpperCase()}`;

    // Find linked tour operator if available
    const tour = lead.tourId
      ? await prisma.tour.findUnique({
          where: { id: lead.tourId },
          select: {
            id: true,
            slug: true,
            operatorName: true,
            operatorPhone: true,
            operatorEmail: true,
          },
        })
      : null;

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
          orderBy: { createdAt: 'asc' },
          take: 50,
          select: {
            id: true,
            sender: true,
            body: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      lead: {
        ...lead,
        reference: ref,
        isInquiry,
        operator: tour
          ? {
              name: tour.operatorName,
              phone: tour.operatorPhone,
              email: tour.operatorEmail,
            }
          : null,
        conversationId: conversation?.id || null,
        messages: conversation?.messages || [],
      },
    });
  } catch (err: any) {
    console.error('Failed to get lead details:', err);
    return NextResponse.json({ error: 'Failed to get lead details' }, { status: 500 });
  }
}

/**
 * POST /api/admin/leads/[id]
 * Administrator replies directly from the Lead detail drawer.
 * Creates an ADMIN message in the shared LiveChatConversation, updates the lead
 * status from INTERESTED to CONTACTED, records the notification log, and emails the guest.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const messageText = sanitizePlain(body.message, 1200);

    if (!messageText || messageText.length < 2) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const lead = await prisma.bookingLead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const isInquiry = lead.source === 'INQUIRY';
    const ref = isInquiry
      ? `INQ-${lead.id.slice(-8).toUpperCase()}`
      : `RES-${lead.id.slice(-8).toUpperCase()}`;

    // Find or create the linked live chat conversation
    let conversation = await prisma.liveChatConversation.findFirst({
      where: {
        OR: [
          { messages: { some: { body: { contains: ref } } } },
          ...(lead.customerEmail ? [{ visitorEmail: lead.customerEmail }] : []),
          ...(lead.customerPhone ? [{ visitorPhone: lead.customerPhone }] : []),
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.liveChatConversation.create({
        data: {
          visitorToken: crypto.randomUUID(),
          visitorName: lead.customerName || undefined,
          visitorEmail: lead.customerEmail || undefined,
          visitorPhone: lead.customerPhone || undefined,
          lastPagePath: lead.tourSlug ? `/tours/${lead.tourSlug}` : undefined,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
      });
    }

    // Insert message into the shared live chat stream
    const newMessage = await prisma.liveChatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: 'ADMIN',
        body: messageText,
      },
      select: {
        id: true,
        sender: true,
        body: true,
        createdAt: true,
      },
    });

    await prisma.liveChatConversation.update({
      where: { id: conversation.id },
      data: {
        status: 'OPEN',
        lastMessageAt: new Date(),
      },
    });

    // Auto-advance lead status to CONTACTED if currently INTERESTED
    let nextStatus = lead.status;
    if (lead.status === 'INTERESTED') {
      nextStatus = 'CONTACTED';
      await prisma.bookingLead.update({
        where: { id: lead.id },
        data: { status: 'CONTACTED', updatedAt: new Date() },
      });
    }

    // Log notification
    await prisma.notificationLog.create({
      data: {
        bookingId: lead.id,
        channel: 'ADMIN_CHAT_REPLY',
        recipient: lead.customerEmail || lead.customerPhone || 'Guest',
        status: 'SENT',
        messageId: newMessage.id,
      },
    }).catch(() => {});

    // Send branded email notification to customer
    if (lead.customerEmail && process.env.RESEND_API_KEY) {
      try {
        const { sendAdminReplyEmail } = await import('@/lib/email');
        const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com';
        await sendAdminReplyEmail(lead.customerEmail, {
          customerName: lead.customerName || 'Traveler',
          reference: ref,
          tourName: lead.tourTitle || undefined,
          adminMessage: messageText,
          replyUrl: `${SITE_URL}/my-bookings`,
        });
      } catch (emailErr) {
        console.warn('[lead/reply] Email notification non-fatal error:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
      conversationId: conversation.id,
      leadStatus: nextStatus,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to post lead reply:', err);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
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
