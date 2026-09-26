import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

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
// Availability Checker — accepts an optional tx client so it can run inside
// a transaction (preventing the read-then-write race condition).
// ---------------------------------------------------------------------------

export type TxClient = Prisma.TransactionClient | PrismaClient;

export async function checkAvailability(
  params: AvailabilityCheckParams,
  db: TxClient = prisma,
): Promise<AvailabilityResult> {
  const { tourId, date, timeSlotId, requestedGuests } = params;

  // Normalize date to midnight for consistent day-level comparison
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Slot-level capacity check
  if (timeSlotId) {
    const slot = await db.tourTimeSlot.findUnique({
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

    const confirmedInSlot = await db.booking.aggregate({
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
  const tour = await db.tour.findUnique({
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

  const confirmedForDay = await db.booking.aggregate({
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
// Enforcement — throws CapacityExceededError if capacity is exceeded.
// Pass `db` to run inside a transaction for atomic check-then-insert.
// ---------------------------------------------------------------------------

export async function enforceCapacity(
  params: AvailabilityCheckParams,
  db: TxClient = prisma,
): Promise<AvailabilityResult> {
  const result = await checkAvailability(params, db);

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
