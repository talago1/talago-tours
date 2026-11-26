import { NextRequest, NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { resolveRequestUser } from '@/server/customerSession';
import { sanitizePlain } from '@/utils/sanitize';
import { phonesEquivalent } from '@/utils/phoneMatch';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * POST /api/public/booking-interest/withdraw
 * Marks an unconfirmed preliminary Interest (BookingLead) as withdrawn (ABANDONED),
 * preserves the record and conversation history, and blocks stale retries from
 * converting this withdrawn attempt into a confirmed booking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = sanitizePlain(body.leadId, 60);
    const attemptId = sanitizePlain(body.attemptId, 100);
    const reason = sanitizePlain(body.reason, 300);

    if (!leadId && !attemptId) {
      return NextResponse.json({ error: 'leadId or attemptId is required' }, { status: 400, headers: NO_STORE });
    }

    const session = await getSessionFromRequest(request);
    let authEmail = session?.email?.toLowerCase() || null;
    let authPhone = session?.phone || session?.telegramPhone || null;

    if (!session) {
      const auth = await resolveRequestUser(request);
      if (auth?.user?.email) authEmail = auth.user.email.toLowerCase();
      if (auth?.user?.phone) authPhone = auth.user.phone;
    }

    const chatCookie = request.cookies.get('talago_live_chat')?.value || null;

    const lead = leadId
      ? await prisma.bookingLead.findUnique({ where: { id: leadId } })
      : await prisma.bookingLead.findFirst({
          where: { sessionId: attemptId },
          orderBy: { createdAt: 'desc' },
        });

    if (!lead) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404, headers: NO_STORE });
    }

    // Verify ownership: authenticated email/phone match OR matching guest chat cookie
    const emailMatches = Boolean(authEmail && lead.customerEmail && authEmail === lead.customerEmail.toLowerCase());
    const phoneMatches = Boolean(authPhone && lead.customerPhone && phonesEquivalent(authPhone, lead.customerPhone));
    let cookieMatches = false;
    if (!emailMatches && !phoneMatches && chatCookie) {
      const conv = await prisma.liveChatConversation.findFirst({
        where: {
          OR: [
            { leadId: lead.id },
            ...(lead.sessionId ? [{ visitorToken: `attempt:${lead.sessionId}` }] : []),
          ],
          visitorToken: chatCookie,
        },
        select: { id: true },
      });
      cookieMatches = Boolean(conv);
    }

    if (!emailMatches && !phoneMatches && !cookieMatches) {
      return NextResponse.json({ error: 'Unauthorized to withdraw this request' }, { status: 403, headers: NO_STORE });
    }

    if (lead.bookingId) {
      return NextResponse.json(
        { error: 'This request has already progressed to a booking. Please use booking cancellation instead.' },
        { status: 409, headers: NO_STORE }
      );
    }

    if (lead.status === LeadStatus.ABANDONED) {
      return NextResponse.json({ success: true, leadId: lead.id, status: lead.status }, { headers: NO_STORE });
    }

    const updatedNote = [
      lead.notes,
      `Withdrawn by customer on ${new Date().toISOString()}${reason ? `: ${reason}` : ''}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const updated = await prisma.bookingLead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.ABANDONED,
        notes: updatedNote.slice(0, 1000),
        updatedAt: new Date(),
      },
    });

    const ref = `RES-${lead.id.slice(-8).toUpperCase()}`;

    // Append system message to the shared conversation (preserve history)
    const conversation = await prisma.liveChatConversation.findFirst({
      where: {
        OR: [
          ...(lead.sessionId ? [{ visitorToken: `attempt:${lead.sessionId}` }] : []),
          { leadId: lead.id },
          { visitorToken: `lead:${lead.id}` },
        ],
      },
      select: { id: true },
    });

    if (conversation) {
      await prisma.liveChatMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'SYSTEM',
          body: `[REQUEST WITHDRAWN] Preliminary request ${ref} was withdrawn by the customer.${reason ? ` Reason: ${reason}` : ''}`,
        },
      }).catch(() => {});

      await prisma.liveChatConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        leadId: updated.id,
        status: updated.status,
        reference: ref,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error('[booking-interest/withdraw] Error:', err);
    return NextResponse.json({ error: 'Failed to withdraw request' }, { status: 500, headers: NO_STORE });
  }
}
