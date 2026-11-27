import { NextRequest, NextResponse } from 'next/server';
import { BookingMessageSender, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { phoneMatchKey } from '@/utils/phoneMatch';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('pageSize') || DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE)
    );
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || 'ALL').trim();
    const tourId = (searchParams.get('tourId') || 'ALL').trim();
    const dateFrom = (searchParams.get('dateFrom') || '').trim();
    const dateTo = (searchParams.get('dateTo') || '').trim();
    const dateBasis = searchParams.get('dateBasis') === 'createdAt' ? 'createdAt' : 'travelDate';
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const filters: Prisma.BookingWhereInput[] = [];

    if (status && status !== 'ALL') {
      filters.push({ status: status as any });
    }
    if (tourId && tourId !== 'ALL') {
      filters.push({ tourId });
    }
    if (dateFrom || dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (dateFrom) dateFilter.gte = new Date(`${dateFrom}T00:00:00Z`);
      if (dateTo) dateFilter.lte = new Date(`${dateTo}T23:59:59Z`);
      filters.push({ [dateBasis]: dateFilter });
    }
    if (unreadOnly) {
      filters.push({
        conversation: {
          messages: {
            some: { sender: BookingMessageSender.VISITOR, readAt: null },
          },
        },
      });
    }
    if (search) {
      const phoneKey = phoneMatchKey(search);
      const searchOr: Prisma.BookingWhereInput[] = [
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { tourTitleSnapshot: { contains: search, mode: 'insensitive' } },
        { hotelName: { contains: search, mode: 'insensitive' } },
      ];
      if (phoneKey) {
        searchOr.push({ customerPhoneNormalized: phoneKey });
      }
      filters.push({ OR: searchOr });
    }

    const whereClause: Prisma.BookingWhereInput = filters.length > 0 ? { AND: filters } : {};

    const [total, bookings, totalUnread] = await Promise.all([
      prisma.booking.count({ where: whereClause }),
      prisma.booking.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          bookingReference: true,
          tourId: true,
          tourTitleSnapshot: true,
          destinationNameSnapshot: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          customerProfileId: true,
          travelDate: true,
          createdAt: true,
          updatedAt: true,
          guestCount: true,
          adultsCount: true,
          childrenCount: true,
          infantsCount: true,
          totalPriceUSD: true,
          currency: true,
          paymentStatus: true,
          whatsappOptIn: true,
          historicalTourSnapshot: true,
          hotelName: true,
          roomNumber: true,
          selectedPickupTime: true,
          pickupDirectives: true,
          pickupType: true,
          pickupLocationName: true,
          pickupAddress: true,
          flightNumbers: true,
          bedConfiguration: true,
          bedConfig: true,
          specialRequirements: true,
          status: true,
          language: true,
          paymentScheme: true,
          amountPaidOnline: true,
          amountDueOnArrival: true,
          source: true,
          notes: true,
          bookingAnswers: true,
          selectedAddons: true,
          tour: {
            select: {
              id: true,
              category: true,
              translations: true,
              durationHours: true,
              durationDisplay: true,
              inclusions: true,
              exclusions: true,
              highlights: true,
              hasGuide: true,
              guideLanguages: true,
              freeCancellationHours: true,
              instantConfirmation: true,
              fitnessLevel: true,
              wheelchairAccessible: true,
              strollerAccessible: true,
              accessibilityNotes: true,
              safetyGuidelines: true,
              routeStops: true,
              operatorName: true,
              operatorPhone: true,
              destination: { select: { name: true } },
              zone: { select: { name: true, location: true } },
            },
          },
          conversation: {
            select: {
              id: true,
              lastMessageAt: true,
              messages: {
                where: { sender: 'VISITOR' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { body: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bookingMessage.count({
        where: { sender: BookingMessageSender.VISITOR, readAt: null },
      }),
    ]);

    const convIds = bookings
      .map((b) => b.conversation?.id)
      .filter((id): id is string => Boolean(id));

    const unreadCountMap = new Map<string, number>();
    if (convIds.length > 0) {
      const grouped = await prisma.bookingMessage.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: { in: convIds },
          sender: BookingMessageSender.VISITOR,
          readAt: null,
        },
        _count: { _all: true },
      });
      for (const row of grouped) {
        unreadCountMap.set(row.conversationId, row._count._all);
      }
    }

    const tickets: ActiveQueueTicket[] = bookings.map((b) => {
      const translations = b.tour?.translations as Record<string, any> | null;
      const enTrans = translations?.en || {};
      const historicalSnapshot = b.historicalTourSnapshot as any;
      const tourTitle = b.tourTitleSnapshot || enTrans?.title || historicalSnapshot?.title || 'Tour Experience';
      const convId = b.conversation?.id ?? null;
      return {
        id: b.id,
        bookingReference: b.bookingReference,
        tourTitle,
        tourId: b.tourId ?? undefined,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        customerProfileId: b.customerProfileId ?? null,
        travelDate: b.travelDate.toISOString().split('T')[0],
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        category: b.tour?.category || historicalSnapshot?.category || 'Tour',
        guestCount: b.guestCount,
        adultsCount: b.adultsCount,
        childrenCount: b.childrenCount,
        infantsCount: b.infantsCount,
        totalPriceUSD: b.totalPriceUSD,
        currency: b.currency,
        paymentStatus: b.paymentStatus,
        whatsappOptIn: b.whatsappOptIn,
        hotelName: b.hotelName,
        roomNumber: b.roomNumber,
        pickupTime: b.selectedPickupTime || null,
        pickupDirectives: b.pickupDirectives,
        pickupType: b.pickupType,
        pickupLocationName: b.pickupLocationName,
        pickupAddress: b.pickupAddress,
        flightNumbers: b.flightNumbers,
        bedConfiguration: b.bedConfiguration ?? b.bedConfig,
        bedConfig: b.bedConfig ?? b.bedConfiguration,
        specialRequirements: b.specialRequirements,
        status: b.status as BookingStatus,
        language: b.language,
        paymentScheme: b.paymentScheme ?? undefined,
        amountPaidOnline: b.amountPaidOnline ? Number(b.amountPaidOnline) : undefined,
        amountDueOnArrival: b.amountDueOnArrival ? Number(b.amountDueOnArrival) : undefined,
        zoneName: b.tour?.zone?.name ?? undefined,
        destinationName: b.destinationNameSnapshot || b.tour?.destination?.name || undefined,
        selectedAddons: b.selectedAddons,
        bookingAnswers: b.bookingAnswers,
        source: b.source,
        notes: b.notes,
        conversationId: convId,
        unreadMessageCount: convId ? (unreadCountMap.get(convId) ?? 0) : 0,
        lastMessagePreview: b.conversation?.messages?.[0]?.body ?? null,
        lastMessageAt: b.conversation?.lastMessageAt?.toISOString() ?? null,
        tourDetails: {
          description: enTrans?.shortDescription || enTrans?.description || historicalSnapshot?.description || null,
          durationHours: b.tour?.durationHours ?? historicalSnapshot?.durationHours ?? null,
          durationDisplay: b.tour?.durationDisplay ?? historicalSnapshot?.durationDisplay ?? null,
          inclusions: (b.tour?.inclusions?.length ? b.tour.inclusions : enTrans?.inclusions || historicalSnapshot?.inclusions) ?? [],
          exclusions: (b.tour?.exclusions?.length ? b.tour.exclusions : enTrans?.exclusions || historicalSnapshot?.exclusions) ?? [],
          highlights: (b.tour?.highlights?.length ? b.tour.highlights : enTrans?.highlights || historicalSnapshot?.highlights) ?? [],
          hasGuide: b.tour?.hasGuide ?? false,
          guideLanguages: b.tour?.guideLanguages ?? [],
          freeCancellationHours: b.tour?.freeCancellationHours ?? historicalSnapshot?.freeCancellationHours ?? 24,
          instantConfirmation: b.tour?.instantConfirmation ?? true,
          fitnessLevel: b.tour?.fitnessLevel ?? null,
          wheelchairAccessible: b.tour?.wheelchairAccessible ?? false,
          strollerAccessible: b.tour?.strollerAccessible ?? false,
          accessibilityNotes: b.tour?.accessibilityNotes ?? null,
          safetyGuidelines: b.tour?.safetyGuidelines ?? [],
          routeStops: b.tour?.routeStops ?? enTrans?.itinerary ?? null,
          itinerary: enTrans?.itinerary ?? null,
          meetingPoint: enTrans?.meetingPoint || b.tour?.zone?.location || null,
          requirements: enTrans?.requirements ?? null,
          operatorName: b.tour?.operatorName ?? null,
          operatorPhone: b.tour?.operatorPhone ?? null,
        },
      };
    });

    return NextResponse.json({
      bookings: tickets,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: { totalUnread },
    });
  } catch (error) {
    console.error('GET /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids, all, status, tourId, startDate, endDate, month } = body as {
      ids?: string[];
      all?: boolean;
      status?: string;
      tourId?: string;
      startDate?: string;
      endDate?: string;
      month?: string;
    };

    let whereClause: any = {};

    if (all === true) {
      whereClause = {};
    } else if (Array.isArray(ids) && ids.length > 0) {
      whereClause = { id: { in: ids } };
    } else {
      const filters: any[] = [];
      if (status && status !== 'ALL') {
        filters.push({ status });
      }
      if (tourId && tourId !== 'ALL') {
        filters.push({ tourId });
      }
      if (month) {
        const [y, m] = month.split('-').map(Number);
        if (y && m) {
          const startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
          const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59));
          filters.push({ travelDate: { gte: startOfMonth, lte: endOfMonth } });
        }
      } else if (startDate || endDate) {
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(`${startDate}T00:00:00Z`);
        if (endDate) dateFilter.lte = new Date(`${endDate}T23:59:59Z`);
        filters.push({ travelDate: dateFilter });
      }

      if (filters.length === 0) {
        return NextResponse.json(
          { error: 'Provide ids array, filter criteria (tourId, date, month, status), or all=true to delete' },
          { status: 400 }
        );
      }

      whereClause = { AND: filters };
    }

    const bookingsToDelete = await prisma.booking.findMany({
      where: whereClause,
      select: { id: true },
    });

    const targetIds = bookingsToDelete.map((b) => b.id);

    if (targetIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No bookings matched' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated transactions
      await tx.transaction.deleteMany({
        where: { bookingId: { in: targetIds } },
      });

      // 2. Unlink associated reviews
      await tx.review.updateMany({
        where: { bookingId: { in: targetIds } },
        data: { bookingId: null },
      });

      // 3. Delete the bookings
      await tx.booking.deleteMany({
        where: { id: { in: targetIds } },
      });
    });

    return NextResponse.json({
      success: true,
      count: targetIds.length,
      message: `Successfully deleted ${targetIds.length} booking(s)`,
    });
  } catch (error) {
    console.error('DELETE /api/admin/bookings error:', error);
    return NextResponse.json({ error: 'Failed to delete bookings' }, { status: 500 });
  }
}
