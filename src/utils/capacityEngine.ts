import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailabilityCheckParams {
  tourId: string;
  date: Date;
  timeSlotId?: string | null;
  requestedGuests: number;
}

export interface AvailabilityResult {
  available: boolean;
  remainingSeats: number;
  totalCapacity: number;
  confirmedGuests: number;
  timeSlotLabel?: string;
}

export class CapacityExceededError extends Error {
  constructor(
    message: string,
    public readonly remainingSeats: number,
    public readonly totalCapacity: number,
  ) {
    super(message);
    this.name = 'CapacityExceededError';
  }
}

// ---------------------------------------------------------------------------
// Availability Checker
// ---------------------------------------------------------------------------

export async function checkAvailability(
  params: AvailabilityCheckParams,
): Promise<AvailabilityResult> {
  const { tourId, date, timeSlotId, requestedGuests } = params;

  // Normalize date to midnight for consistent day-level comparison
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Slot-level capacity check
  if (timeSlotId) {
    const slot = await prisma.tourTimeSlot.findUnique({
      where: { id: timeSlotId },
      select: {
        id: true,
        label: true,
        maxCapacityPerSlot: true,
        tourId: true,
      },
    });

    if (!slot || slot.tourId !== tourId) {
      return {
        available: false,
        remainingSeats: 0,
        totalCapacity: 0,
        confirmedGuests: 0,
        timeSlotLabel: undefined,
      };
    }

    const confirmedInSlot = await prisma.booking.aggregate({
      where: {
        tourId,
        timeSlotId,
        travelDate: { gte: dayStart, lt: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      _sum: { guestCount: true },
    });

    const confirmedGuests = confirmedInSlot._sum.guestCount ?? 0;
    const remainingSeats = Math.max(0, slot.maxCapacityPerSlot - confirmedGuests);

    return {
      available: remainingSeats >= requestedGuests,
      remainingSeats,
      totalCapacity: slot.maxCapacityPerSlot,
      confirmedGuests,
      timeSlotLabel: slot.label,
    };
  }

  // Tour-level daily capacity check
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { maxCapacity: true },
  });

  if (!tour) {
    return {
      available: false,
      remainingSeats: 0,
      totalCapacity: 0,
      confirmedGuests: 0,
    };
  }

  const confirmedForDay = await prisma.booking.aggregate({
    where: {
      tourId,
      travelDate: { gte: dayStart, lt: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    _sum: { guestCount: true },
  });

  const confirmedGuests = confirmedForDay._sum.guestCount ?? 0;
  const remainingSeats = Math.max(0, tour.maxCapacity - confirmedGuests);

  return {
    available: remainingSeats >= requestedGuests,
    remainingSeats,
    totalCapacity: tour.maxCapacity,
    confirmedGuests,
  };
}

// ---------------------------------------------------------------------------
// Enforcement — throws if capacity exceeded
// ---------------------------------------------------------------------------

export async function enforceCapacity(
  params: AvailabilityCheckParams,
): Promise<AvailabilityResult> {
  const result = await checkAvailability(params);

  if (!result.available) {
    const label = result.timeSlotLabel ? ` (${result.timeSlotLabel})` : '';
    throw new CapacityExceededError(
      `This experience${label} is fully booked. Only ${result.remainingSeats} seats remain out of ${result.totalCapacity}.`,
      result.remainingSeats,
      result.totalCapacity,
    );
  }

  return result;
}
