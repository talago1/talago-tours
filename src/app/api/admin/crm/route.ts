export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LeadStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'overview';
    const search = searchParams.get('search')?.trim() || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const customerId = searchParams.get('customerId')?.trim() || '';

    // ─────────────────────────────────────────────────────────────────────────
    // 1. OVERVIEW: High-level CRM Pipeline & Action Queue Metrics
    // ─────────────────────────────────────────────────────────────────────────
    if (view === 'overview') {
      const [
        totalLeads,
        interestedLeads,
        inProgressLeads,
        contactedLeads,
        convertedLeads,
        totalCustomers,
        totalBookings,
        openConversations,
        unansweredInquiries,
      ] = await Promise.all([
        prisma.bookingLead.count(),
        prisma.bookingLead.count({ where: { status: LeadStatus.INTERESTED } }),
        prisma.bookingLead.count({ where: { status: LeadStatus.IN_PROGRESS } }),
        prisma.bookingLead.count({ where: { status: LeadStatus.CONTACTED } }),
        prisma.bookingLead.count({ where: { status: LeadStatus.CONVERTED } }),
        prisma.customerProfile.count(),
        prisma.booking.count(),
        prisma.liveChatConversation.count({ where: { status: 'OPEN' } }),
        prisma.bookingLead.count({ where: { source: 'INQUIRY', status: LeadStatus.INTERESTED } }),
      ]);

      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;
      const needsActionCount = interestedLeads + unansweredInquiries;

      return NextResponse.json({
        metrics: {
          totalLeads,
          interestedLeads,
          inProgressLeads,
          contactedLeads,
          convertedLeads,
          totalCustomers,
          totalBookings,
          openConversations,
          unansweredInquiries,
          conversionRate,
          needsActionCount,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FOLLOW-UP QUEUE: Only records genuinely needing action
    // ─────────────────────────────────────────────────────────────────────────
    if (view === 'follow-ups') {
      // Find leads that need action:
      // - New booking interests (INTERESTED)
      // - Inquiries waiting for an answer (source: INQUIRY, status: INTERESTED or IN_PROGRESS)
      // - Leads where notes explicitly mention follow-up
      const followUpWhere: any = {
        status: { in: [LeadStatus.INTERESTED, LeadStatus.IN_PROGRESS] },
      };

      if (search) {
        followUpWhere.OR = [
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
          { tourTitle: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
        ];
      }

      const items = await prisma.bookingLead.findMany({
        where: followUpWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          booking: {
            select: { id: true, bookingReference: true, status: true, paymentStatus: true },
          },
        },
      });

      // Classify items
      const queue = items.map((item) => {
        let queueStatus: 'Needs Action' | 'Follow-up Scheduled' = 'Needs Action';
        if (item.notes && item.notes.toLowerCase().includes('follow-up')) {
          queueStatus = 'Follow-up Scheduled';
        }
        return {
          id: item.id,
          type: item.source === 'INQUIRY' ? 'INQUIRY' : 'BOOKING_INTEREST',
          reference: item.id.startsWith('INQ-') || item.id.startsWith('RES-') ? item.id : `RES-${item.id.slice(-6).toUpperCase()}`,
          customerName: item.customerName || 'Anonymous Traveler',
          customerEmail: item.customerEmail,
          customerPhone: item.customerPhone,
          tourTitle: item.tourTitle || 'General Egyptian Tour',
          tourSlug: item.tourSlug,
          travelDate: item.travelDate,
          estimatedPrice: item.totalEstimatedPrice,
          currency: item.currency,
          status: item.status,
          queueStatus,
          notes: item.notes,
          createdAt: item.createdAt,
          booking: item.booking,
        };
      });

      return NextResponse.json({ queue });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CUSTOMER JOURNEY DETAIL: Unified Timeline of an Individual Customer
    // ─────────────────────────────────────────────────────────────────────────
    if (view === 'customer-detail' && customerId) {
      // Find customer profile, leads, bookings, and chat
      const [profile, leads, bookings, chat] = await Promise.all([
        prisma.customerProfile.findFirst({
          where: {
            OR: [
              { id: customerId },
              { email: { equals: customerId, mode: 'insensitive' } },
              { phone: { equals: customerId } },
            ],
          },
        }),
        prisma.bookingLead.findMany({
          where: {
            OR: [
              { customerEmail: { equals: customerId, mode: 'insensitive' } },
              { customerPhone: { equals: customerId } },
            ],
          },
          orderBy: { createdAt: 'desc' },
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
        prisma.liveChatConversation.findFirst({
          where: {
            OR: [
              { visitorEmail: { equals: customerId, mode: 'insensitive' } },
              { visitorPhone: { equals: customerId } },
            ],
          },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        }),
      ]);

      return NextResponse.json({
        customer: {
          profile,
          leads,
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
            tourTitle: (b.tour?.translations as any)?.en?.title || b.tour?.slug || 'Tour Experience',
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

      const inquiries = await prisma.bookingLead.findMany({
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
    if (status && Object.values(LeadStatus).includes(status)) {
      data.status = status;
    }

    const updated = await prisma.bookingLead.update({
      where: { id: leadId },
      data,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('[admin-crm-patch] Error:', error);
    return NextResponse.json({ error: 'Failed to update CRM lead' }, { status: 500 });
  }
}

