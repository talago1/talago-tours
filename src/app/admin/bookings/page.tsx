import { prisma } from '@/lib/prisma';
import BookingQueue from '@/components/admin/BookingQueue';
import type { ActiveQueueTicket, BookingStatus } from '@/types/booking';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      tour: {
        select: { translations: true, itinerary: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const tickets: ActiveQueueTicket[] = bookings.map((b) => {
    const translations = b.tour.translations as Record<string, { title?: string }> | null;
    const itinerary = b.tour.itinerary as { time?: string }[] | null;
    return {
      id: b.id,
      bookingReference: b.bookingReference,
      tourTitle: translations?.en?.title ?? 'Unknown Tour',
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      travelDate: b.travelDate.toISOString().split('T')[0],
      guestCount: b.guestCount,
      totalPriceUSD: b.totalPriceUSD,
      hotelName: b.hotelName,
      pickupTime: itinerary?.[0]?.time ?? null,
      status: b.status as BookingStatus,
      language: b.language,
    };
  });

  return (
    <main className="min-h-screen bg-neutral-light py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Booking Queue</h1>
        <BookingQueue initialBookings={tickets} />
      </div>
    </main>
  );
}
