import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Booking } from '@prisma/client';

/**
 * Booking access tokens.
 *
 * `bookingReference` (e.g. TLG-2026-WRT9) is a human-readable identifier meant
 * for display and for support conversations. It is NOT a secret and must never
 * authorise anything: its random part is only 4 characters, so the whole
 * keyspace is walkable.
 *
 * `accessToken` is the capability that grants access to customer-specific
 * booking data. It is 256 bits from a CSPRNG, is independent of the reference,
 * and cannot be derived from it.
 */

// 32 bytes -> 256 bits -> 43 base64url characters.
const TOKEN_BYTES = 32;

// Reject anything that cannot be a real token before touching the database.
const TOKEN_MIN_LENGTH = 43;
const TOKEN_MAX_LENGTH = 128;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export function generateAccessToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function isPlausibleAccessToken(value: unknown): value is string {
  return (
    typeof value === 'string'
    && value.length >= TOKEN_MIN_LENGTH
    && value.length <= TOKEN_MAX_LENGTH
    && BASE64URL.test(value)
  );
}

/**
 * Resolve a booking from its access token. Returns null for anything that is
 * not a well-formed token, which is what makes a missing or malformed token
 * fail closed rather than falling back to a looser lookup.
 */
export async function getBookingByAccessToken(
  token: unknown,
): Promise<Booking | null> {
  if (!isPlausibleAccessToken(token)) return null;
  return prisma.booking.findUnique({ where: { accessToken: token } });
}

/** True only when the token belongs to that booking. Used before any write. */
export async function accessTokenMatchesBooking(
  token: unknown,
  bookingId: string,
): Promise<boolean> {
  if (!isPlausibleAccessToken(token)) return false;
  const found = await prisma.booking.findFirst({
    where: { accessToken: token, id: bookingId },
    select: { id: true },
  });
  return found !== null;
}