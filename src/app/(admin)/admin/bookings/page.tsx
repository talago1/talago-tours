import { prisma } from '@/lib/prisma';
import BookingQueue from '@/components/admin/BookingQueue';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const [bookings, toursList] = await Promise.all([
    prisma.booking.findMany({
      include: {
        tour: {
          select: {
            id: true,
            category: true,
            translations: true,
            destination: { select: { name: true } },
            zone: { select: { name: true } },
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
  ]);

  const availableTours = toursList.map((t) => {
    const translations = t.translations as Record<string, { title?: string }> | null;
    return {
      id: t.id,
      title: translations?.en?.title || t.slug,
      category: t.category,
    };
  });

  const tickets: ActiveQueueTicket[] = bookings.map((b) => {
    const tourTranslations = b.tour.translations as Record<string, { title?: string }> | null;
    return {
      id: b.id,
      bookingReference: b.bookingReference,
      tourTitle: tourTranslations?.en?.title ?? 'Unknown Tour',
      tourId: b.tourId,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      travelDate: b.travelDate.toISOString().split('T')[0],
      createdAt: b.createdAt.toISOString(),
      category: b.tour.category,
      guestCount: b.guestCount,
      adultsCount: b.adultsCount,
      childrenCount: b.childrenCount,
      infantsCount: b.infantsCount,
      totalPriceUSD: b.totalPriceUSD,
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
      zoneName: b.tour.zone?.name ?? undefined,
      destinationName: b.tour.destination?.name ?? undefined,
      pickupType: b.pickupType,
      pickupLocationName: b.pickupLocationName,
      pickupAddress: b.pickupAddress,
      selectedAddons: b.selectedAddons,
      bookingAnswers: b.bookingAnswers,
    };
  });

  return (
    <main className="min-h-screen bg-[#070F1E] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#06B6D4]">
            Operations
          </p>
          <h1 className="mt-2 text-2xl font-black text-white">Booking Management & Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor, filter, export reports, and bulk-manage bookings.
          </p>
        </div>
        <BookingQueue initialBookings={tickets} availableTours={availableTours} />
      </div>
    </main>
  );
}
