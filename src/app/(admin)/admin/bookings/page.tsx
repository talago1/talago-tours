import { BookingMessageSender } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import BookingQueue from '@/components/admin/BookingQueue';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';

export const dynamic = 'force-dynamic';

const INITIAL_PAGE_SIZE = 25;

export default async function AdminBookingsPage() {
  const [totalBookings, bookings, toursList, totalUnread] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.findMany({
      take: INITIAL_PAGE_SIZE,
      include: {
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
    prisma.tour.findMany({
      select: {
        id: true,
        slug: true,
        category: true,
        translations: true,
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

  const availableTours = toursList.map((t) => {
    const translations = t.translations as Record<string, { title?: string }> | null;
    return {
      id: t.id,
      title: translations?.en?.title || t.slug,
      category: t.category,
    };
  });

  const tickets: ActiveQueueTicket[] = bookings.map((b) => {
    const tourTranslations = b.tour?.translations as Record<string, any> | null;
    const enTrans = tourTranslations?.en || {};
    const historicalSnapshot = b.historicalTourSnapshot as any;
    return {
      id: b.id,
      bookingReference: b.bookingReference,
      tourTitle: b.tourTitleSnapshot || enTrans?.title || historicalSnapshot?.title || 'Historical Tour',
      tourId: b.tourId ?? undefined,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      customerProfileId: b.customerProfileId ?? null,
      travelDate: b.travelDate.toISOString().split('T')[0],
      createdAt: b.createdAt.toISOString(),
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
      pickupType: b.pickupType,
      pickupLocationName: b.pickupLocationName,
      pickupAddress: b.pickupAddress,
      selectedAddons: b.selectedAddons,
      bookingAnswers: b.bookingAnswers,
      source: b.source,
      notes: b.notes,
      conversationId: b.conversation?.id ?? null,
      unreadMessageCount: b.conversation?.id ? (unreadCountMap.get(b.conversation.id) ?? 0) : 0,
      lastMessagePreview: (b.conversation as any)?.messages?.[0]?.body ?? null,
      lastMessageAt: b.conversation?.lastMessageAt?.toISOString() ?? null,
      updatedAt: b.updatedAt.toISOString(),
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

  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#06B6D4]">
            Operations
          </p>
          <h1 className="mt-2 text-2xl font-black text-white">Booking Management & Conversations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage every customer request from initial interest through confirmation, messages, and completion in one place.
          </p>
        </div>
        <BookingQueue
          initialBookings={tickets}
          availableTours={availableTours}
          initialTotalUnread={totalUnread}
          initialPagination={{
            page: 1,
            pageSize: INITIAL_PAGE_SIZE,
            total: totalBookings,
            totalPages: Math.max(1, Math.ceil(totalBookings / INITIAL_PAGE_SIZE)),
          }}
        />
      </div>
    </main>
  );
}
