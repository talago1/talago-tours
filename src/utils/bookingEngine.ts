import type { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateBookingReference } from './bookingReference';
import { supabaseAdmin } from '../lib/supabase/server';
import { dispatchBookingWhatsApp } from './whatsappNotifications';
import { enforceCapacity, CapacityExceededError } from './capacityEngine';


export interface GuestBookingPayload {
  name: string;
  email: string;
  phone: string;
  tourId: string;
  zoneId?: string;
  hotelName?: string;
  travelDate?: string;
  guestCount?: number;
}

export interface MagicLinkInviteResult {
  sent: boolean;
  email: string;
  invitedAt: string;
}

export interface BookingEngineResult {
  bookingId: string;
  bookingReference: string;
  customerProfileId: string;
  customerWasCreated: boolean;
  status: BookingStatus;
  magicLinkInvite: MagicLinkInviteResult;
}

export class BookingEngineError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly field?: keyof GuestBookingPayload,
  ) {
    super(message);
    this.name = 'BookingEngineError';
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePayload(payload: GuestBookingPayload): {
  name: string;
  email: string;
  phone: string;
  tourId: string;
  zoneId?: string;
  hotelName: string;
  travelDate: Date;
  guestCount: number;
} {
  const name = payload.name?.trim();
  const email = normalizeEmail(payload.email ?? '');
  const phone = payload.phone?.trim();
  const tourId = payload.tourId?.trim();
  const guestCount = payload.guestCount ?? 1;
  const hotelName = payload.hotelName?.trim() || 'To be confirmed by concierge';
  const travelDate = payload.travelDate
    ? new Date(`${payload.travelDate}T00:00:00`)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (!name || name.length < 2) {
    throw new BookingEngineError('Guest name is required.', 400, 'name');
  }

  if (!email || !email.includes('@')) {
    throw new BookingEngineError('A valid guest email is required.', 400, 'email');
  }

  if (!phone || phone.length < 6) {
    throw new BookingEngineError('A valid guest phone is required.', 400, 'phone');
  }

  if (!tourId) {
    throw new BookingEngineError('tourId is required.', 400, 'tourId');
  }

  if (!Number.isInteger(guestCount) || guestCount < 1) {
    throw new BookingEngineError('guestCount must be at least 1.', 400, 'guestCount');
  }

  if (Number.isNaN(travelDate.getTime())) {
    throw new BookingEngineError('travelDate must be a valid date.', 400, 'travelDate');
  }

  return {
    name,
    email,
    phone,
    tourId,
    zoneId: payload.zoneId?.trim() || undefined,
    hotelName,
    travelDate,
    guestCount,
  };
}

function createMagicLinkInvite(email: string): MagicLinkInviteResult {
  const invitedAt = new Date().toISOString();

  return {
    sent: true,
    email,
    invitedAt,
  };
}

export async function createImplicitGuestBooking(
  payload: GuestBookingPayload,
): Promise<BookingEngineResult> {
  const input = validatePayload(payload);

  const result = await prisma.$transaction(async (tx) => {
    const tour = await tx.tour.findUnique({
      where: { id: input.tourId },
      select: {
        id: true,
        zoneId: true,
        adultPrice: true,
        maxCapacity: true,
      },
    });

    if (!tour) {
      throw new BookingEngineError('Tour not found.', 404, 'tourId');
    }

    // Atomic aggregate capacity check
    try {
      await enforceCapacity(
        {
          tourId: input.tourId,
          date: input.travelDate,
          requestedGuests: input.guestCount,
        },
        tx,
      );
    } catch (capacityErr) {
      if (capacityErr instanceof CapacityExceededError) {
        throw new BookingEngineError(capacityErr.message, 409, 'guestCount');
      }
      throw capacityErr;
    }

    const zoneId = input.zoneId ?? tour.zoneId;
    const zone = await tx.zone.findUnique({
      where: { id: zoneId },
      select: { id: true, transferFee: true },
    });

    if (!zone) {
      throw new BookingEngineError('Pickup zone not found.', 404, 'zoneId');
    }

    const existingProfile = await tx.customerProfile.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    const now = new Date();

    const profile = existingProfile
      ? await tx.customerProfile.update({
          where: { id: existingProfile.id },
          data: {
            name: input.name,
            phone: input.phone,
            lastMagicLinkAt: now,
          },
          select: { id: true },
        })
      : await tx.customerProfile.create({
          data: {
            email: input.email,
            name: input.name,
            phone: input.phone,
            isShadow: true,
            invitedAt: now,
            lastMagicLinkAt: now,
          },
          select: { id: true },
        });

    if (!existingProfile) {
      try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(input.email);
      } catch (err) {
        console.error('Supabase background auto-invite failed:', err);
      }
    }

    const totalPriceUSD = input.guestCount * tour.adultPrice + zone.transferFee;
    const bookingReference = generateBookingReference();

    const booking = await tx.booking.create({
      data: {
        bookingReference,
        customerProfileId: profile.id,
        tourId: tour.id,
        zoneId: zone.id,
        hotelName: input.hotelName,
        travelDate: input.travelDate,
        guestCount: input.guestCount,
        totalPriceUSD,
        customerName: input.name,
        customerEmail: input.email,
        customerPhone: input.phone,
        language: 'en',
        status: 'PENDING',
        channel: 'WEBSITE',
        paymentGatewayLogs: [] as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        bookingReference: true,
        status: true,
      },
    });

    return {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      customerProfileId: profile.id,
      customerWasCreated: !existingProfile,
      status: booking.status,
      magicLinkInvite: createMagicLinkInvite(input.email),
    };
  }, {
    isolationLevel: 'Serializable',
  });

  // Fire-and-forget WhatsApp confirmation dispatch
  dispatchBookingWhatsApp(result.bookingId).catch((err) =>
    console.error('WhatsApp auto-dispatch failed:', err),
  );

  return result;
}
