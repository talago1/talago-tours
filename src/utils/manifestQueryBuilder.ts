import { prisma } from '@/lib/prisma';
import type { ManifestItem, DailyTourManifest, ManifestQuery } from '@/types/manifest';
import type { BookingChannel } from '@/types/analytics';

function getTourTitle(translations: unknown): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    return t.en?.title || t.de?.title || 'Unknown Tour';
  }
  return 'Unknown Tour';
}

function getPickupTime(itinerary: unknown): string | undefined {
  if (Array.isArray(itinerary)) {
    const first = itinerary[0] as { time?: string } | undefined;
    return first?.time;
  }
  return undefined;
}

function mapToManifestItem(booking: {
  id: string;
  customerName: string;
  hotelName: string | null;
  roomNumber: string | null;
  guestCount: number;
  paymentStatus: string | null;
  channel: BookingChannel;
  isCheckedIn: boolean;
  tour: { itinerary: unknown };
}): ManifestItem {
  return {
    bookingId: booking.id,
    passengerName: booking.customerName,
    hotelName: booking.hotelName ?? '—',
    roomNumber: booking.roomNumber,
    paxCount: booking.guestCount,
    paymentStatus: booking.paymentStatus,
    channel: booking.channel as BookingChannel,
    isCheckedIn: booking.isCheckedIn,
    pickupTime: getPickupTime(booking.tour.itinerary),
  };
}

export async function buildManifest(
  query: ManifestQuery
): Promise<{ totalBookings: number; totalPassengers: number; groups: DailyTourManifest[] }> {
  const { date } = query;

  const dateStart = new Date(`${date}T00:00:00.000Z`);
  const dateEnd = new Date(dateStart);
  dateEnd.setDate(dateEnd.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      travelDate: { gte: dateStart, lt: dateEnd },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    include: {
      tour: { select: { translations: true, itinerary: true, type: true, maxCapacity: true } },
    },
    orderBy: [{ zoneId: 'asc' }, { customerName: 'asc' }],
  });

  const map = new Map<string, DailyTourManifest>();
  for (const booking of bookings) {
    const tourId = booking.tourId;
    if (!map.has(tourId)) {
      const cap = booking.tour.maxCapacity ?? 0;
      map.set(tourId, {
        tourId,
        tourTitle: getTourTitle(booking.tour.translations),
        tourType: booking.tour.type,
        totalPassengers: 0,
        maxCapacity: cap,
        availableSpots: cap,
        capacityPercent: 0,
        capacityStatus: 'OPEN',
        manifestItems: [],
      });
    }
    const group = map.get(tourId)!;
    group.totalPassengers += booking.guestCount;
    group.manifestItems.push(mapToManifestItem(booking));
  }

  // Finalize capacity calculations
  for (const group of map.values()) {
    const cap = group.maxCapacity || 0;
    if (cap > 0) {
      group.availableSpots = Math.max(0, cap - group.totalPassengers);
      group.capacityPercent = Math.min(200, Math.round((group.totalPassengers / cap) * 100));
      if (group.totalPassengers > cap) {
        group.capacityStatus = 'OVERBOOKED';
      } else if (group.totalPassengers === cap) {
        group.capacityStatus = 'SOLD_OUT';
      } else if (group.totalPassengers >= cap * 0.8) {
        group.capacityStatus = 'SELLING_FAST';
      } else {
        group.capacityStatus = 'OPEN';
      }
    }
  }

  const groups = Array.from(map.values()).sort((a, b) => a.tourTitle.localeCompare(b.tourTitle));

  const totalBookings = bookings.length;
  const totalPassengers = groups.reduce((s, g) => s + g.totalPassengers, 0);

  return { totalBookings, totalPassengers, groups };
}
