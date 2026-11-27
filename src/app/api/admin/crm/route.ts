export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'overview';
    const search = searchParams.get('search')?.trim() || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const customerId = searchParams.get('customerId')?.trim() || '';

    if (view === 'overview') {
      const [
        totalBookings,
        interestedBookings,
        pendingBookings,
        confirmedBookings,
        totalCustomers,
        openConversations,
        unansweredInquiries,
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: BookingStatus.INTERESTED } }),
        prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
        prisma.booking.count({ where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } } }),
        prisma.customerProfile.count(),
        prisma.bookingConversation.count({ where: { status: 'OPEN' } }),
        prisma.booking.count({ where: { source: 'INQUIRY', status: BookingStatus.INTERESTED } }),
      ]);

      const conversionRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 1000) / 10 : 0;
      const needsActionCount = interestedBookings + unansweredInquiries;

      return NextResponse.json({
        metrics: {
          totalLeads: totalBookings,
          interestedLeads: interestedBookings,
          inProgressLeads: pendingBookings,
          contactedLeads: pendingBookings,
          convertedLeads: confirmedBookings,
          totalCustomers,
          totalBookings,
          openConversations,
          unansweredInquiries,
          conversionRate,
          needsActionCount,
        },
      });
    }

    if (view === 'follow-ups') {
      const followUpWhere: any = {
        status: { in: [BookingStatus.INTERESTED, BookingStatus.PENDING] },
      };

      if (search) {
        followUpWhere.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { tourTitleSnapshot: { contains: search, mode: 'insensitive' } },
          { bookingReference: { contains: search, mode: 'insensitive' } },
        ];
      }

      const items = await prisma.booking.findMany({
        where: followUpWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          bookingReference: true,
          source: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          tourTitleSnapshot: true,
          tourSlugSnapshot: true,
          travelDate: true,
          totalPriceUSD: true,
          currency: true,
          status: true,
          paymentStatus: true,
          notes: true,
          createdAt: true,
        },
      });

      const queue = items.map((item) => ({
        id: item.id,
        type: item.source === 'INQUIRY' ? 'INQUIRY' : 'BOOKING_INTEREST',
        reference: item.bookingReference,
        customerName: item.customerName || 'Anonymous Traveler',
        customerEmail: item.customerEmail,
        customerPhone: item.customerPhone,
        tourTitle: item.tourTitleSnapshot || 'General Tour',
        tourSlug: item.tourSlugSnapshot,
        travelDate: item.travelDate.toISOString().split('T')[0],
        estimatedPrice: item.totalPriceUSD,
        currency: item.currency,
        status: item.status,
        queueStatus: item.notes?.toLowerCase().includes('follow-up') ? 'Follow-up Scheduled' : 'Needs Action',
        notes: item.notes,
        createdAt: item.createdAt,
        booking: { id: item.id, bookingReference: item.bookingReference, status: item.status, paymentStatus: item.paymentStatus },
      }));

      return NextResponse.json({ queue });
    }

    if (view === 'customer-detail' && customerId) {
      const [profile, bookings, chat] = await Promise.all([
        prisma.customerProfile.findFirst({
          where: {
            OR: [
              { id: customerId },
              { email: { equals: customerId, mode: 'insensitive' } },
              { phone: { equals: customerId } },
            ],
          },
        }),
        prisma.booking.findMany({
          where: {
            OR: [
              { customerEmail: { equals: customerId, mode: 'insensitive' } },
              { customerPhone: { equals: customerId } },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: { tour: { select: { id: true, slug: true, translations: true, coverImage: true } } },
        }),
        prisma.bookingConversation.findFirst({
          where: {
            OR: [
              { visitorEmail: { equals: customerId, mode: 'insensitive' } },
              { visitorPhone: { equals: customerId } },
            ],
          },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
          },
        }),
      ]);

      return NextResponse.json({
        customer: {
          profile,
          leads: bookings.filter((b) => b.status === BookingStatus.INTERESTED),
          bookings: bookings.map((b) => ({
            id: b.id,
            bookingReference: b.bookingReference,
            travelDate: b.travelDate,
            guestCount: b.guestCount,
            totalPriceUSD: b.totalPriceUSD,
            status: b.status,
            paymentStatus: b.paymentStatus,
            paymentScheme: b.paymentScheme,
            amountPaidOnline: b.amountPaidOnline,
            amountDueOnArrival: b.amountDueOnArrival,
            tourTitle: (b.tour?.translations as any)?.en?.title || b.tourTitleSnapshot || b.tour?.slug || 'Tour Experience',
          })),
          chatConversation: chat,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CUSTOMERS DIRECTORY: Searchable directory with lifetime counts
    // ─────────────────────────────────────────────────────────────────────────
    if (view === 'customers') {
      const customerWhere: any = {};
      if (search) {
        customerWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const profiles = await prisma.customerProfile.findMany({
        where: customerWhere,
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({ customers: profiles });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. INQUIRIES VIEW: Customer questions distinct from bookings
    // ─────────────────────────────────────────────────────────────────────────
    if (view === 'inquiries') {
      const inquiryWhere: any = {
        source: 'INQUIRY',
      };
      if (search) {
        inquiryWhere.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { tourTitle: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
        ];
      }

      const inquiries = await prisma.booking.findMany({
        where: inquiryWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({ inquiries });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. RESERVATIONS VIEW: Confirmed Bookings with payment states
    // ─────────────────────────────────────────────────────────────────────────
    if (view === 'reservations') {
      const bookingWhere: any = {};
      if (search) {
        bookingWhere.OR = [
          { bookingReference: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ];
      }

      const bookings = await prisma.booking.findMany({
        where: bookingWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          tour: {
            select: { id: true, slug: true, translations: true },
          },
        },
      });

      return NextResponse.json({
        reservations: bookings.map((b) => ({
          id: b.id,
          bookingReference: b.bookingReference,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerEmail: b.customerEmail,
          travelDate: b.travelDate,
          guestCount: b.guestCount,
          totalPriceUSD: b.totalPriceUSD,
          status: b.status,
          paymentStatus: b.paymentStatus,
          paymentScheme: b.paymentScheme,
          amountPaidOnline: b.amountPaidOnline,
          amountDueOnArrival: b.amountDueOnArrival,
          tourTitle: (b.tour?.translations as any)?.en?.title || b.tour?.slug,
          createdAt: b.createdAt,
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid CRM view parameter' }, { status: 400 });
  } catch (error) {
    console.error('[admin-crm] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve CRM data' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — Update lead notes, schedule follow-up, or update status
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, notes, status, scheduledFollowUp } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const data: any = { updatedAt: new Date() };
    if (notes !== undefined) {
      data.notes = scheduledFollowUp ? `[Follow-up: ${scheduledFollowUp}] ${notes}` : notes;
    }
    if (status && Object.values(BookingStatus).includes(status)) {
      data.status = status;
    }

    const updated = await prisma.booking.update({
      where: { id: leadId },
      data,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('[admin-crm-patch] Error:', error);
    return NextResponse.json({ error: 'Failed to update CRM lead' }, { status: 500 });
  }
}

