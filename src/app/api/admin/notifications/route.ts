import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingMessageSender } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ADMIN_CHANNELS = ['NEW_BOOKING_ALERT', 'LEAD_INTEREST_ALERT', 'CUSTOMER_MESSAGE_ALERT'] as const;
const NO_STORE = { 'cache-control': 'no-store, private' };

function safeParseMeta(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const [logs, unreadChats] = await Promise.all([
      prisma.notificationLog.findMany({
        where: {
          channel: { in: [...ADMIN_CHANNELS] },
          recipient: 'Admin Dashboard',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.bookingConversation.findMany({
        where: {
          status: 'OPEN',
          messages: { some: { sender: BookingMessageSender.VISITOR, readAt: null } },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: 25,
        include: {
          booking: { select: { id: true, bookingReference: true } },
          messages: {
            where: { sender: BookingMessageSender.VISITOR },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, body: true, createdAt: true },
          },
        },
      }),
    ]);

    const notifications: Array<{
      id: string;
      logId?: string;
      convId?: string;
      leadId?: string;
      type: 'new_booking' | 'new_lead' | 'unread_message';
      title: string;
      customerName: string;
      tourTitle?: string;
      detail: string;
      timestamp: string;
      isRead: boolean;
      actionRequired: boolean;
      linkUrl: string;
      reference?: string;
    }> = [];

    const coveredConvIds = new Set<string>();
    const coveredMessageIds = new Set<string>();

    for (const log of logs) {
      const meta = safeParseMeta(log.errorMessage);
      // Treat legacy 'LOGGED' leads created before this update as unread if recent, or READ if old
      const isRead = log.status === 'READ' || log.status === 'LOGGED';

      if (log.channel === 'NEW_BOOKING_ALERT') {
        const ref = meta.bookingReference || log.bookingId;
        const guestText = meta.guestCount ? `${meta.guestCount} guest${meta.guestCount === 1 ? '' : 's'}` : '';
        const priceText = typeof meta.totalPriceUSD === 'number' ? `$${meta.totalPriceUSD.toFixed(2)}` : '';
        const dateText = meta.travelDate || '';
        notifications.push({
          id: `log-${log.id}`,
          logId: log.id,
          type: 'new_booking',
          title: meta.bookingStatus === 'CONFIRMED' ? 'New Confirmed Booking' : 'New Booking Received',
          customerName: meta.customerName || 'Customer',
          tourTitle: meta.tourTitle || undefined,
          detail: [dateText, guestText, priceText].filter(Boolean).join(' · ') || `Booking #${ref}`,
          timestamp: log.createdAt.toISOString(),
          isRead,
          actionRequired: !isRead,
          linkUrl: `/admin/bookings?ref=${encodeURIComponent(ref)}`,
          reference: ref,
        });
      } else if (log.channel === 'LEAD_INTEREST_ALERT') {
        const bookingId = meta.bookingId || meta.leadId || log.bookingId;
        const ref = meta.bookingReference || meta.reference || `RES-${String(bookingId).slice(-8).toUpperCase()}`;
        const guestText = meta.guests ? `${meta.guests} guest${meta.guests === 1 ? '' : 's'}` : '';
        const dateText = meta.travelDate || 'Date TBD';
        notifications.push({
          id: `log-${log.id}`,
          logId: log.id,
          leadId: bookingId,
          type: 'new_lead',
          title: 'New Booking Interest',
          customerName: meta.customerName || 'Interested Visitor',
          tourTitle: meta.tourTitle || undefined,
          detail: `${dateText}${guestText ? ` · ${guestText}` : ''}${meta.customerPhone ? ` · ${meta.customerPhone}` : ''}`,
          timestamp: log.createdAt.toISOString(),
          isRead,
          actionRequired: !isRead,
          linkUrl: `/admin/bookings?ref=${encodeURIComponent(ref)}`,
          reference: ref,
        });
      } else if (log.channel === 'CUSTOMER_MESSAGE_ALERT') {
        const convId = meta.conversationId || log.bookingId;
        if (convId) coveredConvIds.add(convId);
        if (log.messageId) coveredMessageIds.add(log.messageId);
        const ref = meta.bookingReference || (meta.bookingId ? `RES-${String(meta.bookingId).slice(-8).toUpperCase()}` : undefined);
        notifications.push({
          id: `log-${log.id}`,
          logId: log.id,
          convId,
          type: 'unread_message',
          title: 'New Customer Message',
          customerName: meta.customerName || 'Customer',
          tourTitle: meta.tourTitle || undefined,
          detail: meta.preview || 'New message waiting for reply',
          timestamp: log.createdAt.toISOString(),
          isRead,
          actionRequired: !isRead,
          linkUrl: ref
            ? `/admin/bookings?ref=${encodeURIComponent(ref)}&chat=1`
            : `/admin/bookings?chat=1`,
          reference: ref,
        });
      }
    }

    // Include any unread visitor messages that predate CUSTOMER_MESSAGE_ALERT logging
    for (const conv of unreadChats) {
      const lastMsg = conv.messages[0];
      if (!lastMsg) continue;
      if (coveredMessageIds.has(`msg-${lastMsg.id}`) || coveredConvIds.has(conv.id)) continue;

      const ref = conv.booking?.bookingReference || undefined;
      notifications.push({
        id: `chat-${conv.id}`,
        convId: conv.id,
        type: 'unread_message',
        title: 'Unread Customer Message',
        customerName: conv.visitorName || conv.visitorEmail || 'Customer',
        tourTitle: conv.tourTitle || undefined,
        detail: lastMsg.body.slice(0, 140),
        timestamp: lastMsg.createdAt.toISOString(),
        isRead: false,
        actionRequired: true,
        linkUrl: ref
          ? `/admin/bookings?ref=${encodeURIComponent(ref)}&chat=1`
          : `/admin/bookings?chat=1`,
        reference: ref,
      });
    }

    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json(
      {
        notifications: notifications.slice(0, 50),
        unreadCount,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error('[api/admin/notifications] GET error:', error);
    return NextResponse.json({ error: 'Failed to load admin notifications' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { logId, convId, all } = body as { logId?: string; convId?: string; all?: boolean };

    if (all) {
      await Promise.all([
        prisma.notificationLog.updateMany({
          where: {
            channel: { in: [...ADMIN_CHANNELS] },
            recipient: 'Admin Dashboard',
            status: 'UNREAD',
          },
          data: { status: 'READ' },
        }),
        prisma.bookingMessage.updateMany({
          where: { sender: BookingMessageSender.VISITOR, readAt: null },
          data: { readAt: new Date() },
        }),
      ]);
      return NextResponse.json({ success: true }, { headers: NO_STORE });
    }

    if (logId) {
      await prisma.notificationLog.update({
        where: { id: logId },
        data: { status: 'READ' },
      }).catch(() => {});
    }

    if (convId) {
      await prisma.bookingMessage.updateMany({
        where: { conversationId: convId, sender: BookingMessageSender.VISITOR, readAt: null },
        data: { readAt: new Date() },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/admin/notifications] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notification status' }, { status: 500, headers: NO_STORE });
  }
}
