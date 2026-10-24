import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizeText } from '@/utils/sanitize';

const SETTINGS_KEY = 'partner_tours';
const PARTNER_TOURS_COOKIE = 'talago_partner_tours';
const SUBMISSION_LIMIT = 5;
const SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

export interface PartnerTourSubmission {
  id: string;
  title: string;
  destination: string;
  category: string;
  durationHours: number;
  adultPrice: number;
  childPrice?: number;
  pickupHub?: string;
  description: string;
  highlights?: string;
  inclusions?: string;
  exclusions?: string;
  operatorNotes?: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED';
  createdAt: string;
  updatedAt: string;
  ownerTokenHash?: string;
}

function tokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function partnerToursCookie(response: NextResponse, token: string) {
  response.cookies.set(PARTNER_TOURS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/partner',
    maxAge: 60 * 60 * 24 * 180,
  });
}

/**
 * Partners do not have account authentication yet. A private, httpOnly
 * receipt token scopes the portal to submissions made in this browser, while
 * the admin route remains the only place that can enumerate all proposals.
 */
export async function GET(request: NextRequest) {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const tours: PartnerTourSubmission[] = record
      ? parseSettingValue<PartnerTourSubmission[]>(record.value, [])
      : [];

    const receipt = request.cookies.get(PARTNER_TOURS_COOKIE)?.value;
    if (!receipt) return NextResponse.json({ tours: [], total: 0 });

    const ownerTokenHash = tokenHash(receipt);
    const ownTours = tours
      .filter((tour) => tour.ownerTokenHash === ownerTokenHash)
      .map(({ ownerTokenHash: _ownerTokenHash, operatorNotes: _operatorNotes, ...tour }) => tour);

    return NextResponse.json({ tours: ownTours, total: ownTours.length });
  } catch (err: any) {
    console.error('[partner-tours-get] error:', err);
    return NextResponse.json({ error: 'Failed to fetch partner tours' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'partner-tour-submission'), SUBMISSION_LIMIT, SUBMISSION_WINDOW_MS);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  try {
    const body = await request.json();
    const {
      title,
      destination,
      category,
      durationHours,
      adultPrice,
      childPrice,
      pickupHub,
      description,
      highlights,
      inclusions,
      exclusions,
      operatorNotes,
    } = body;

    const normalizedTitle = sanitizePlain(title, 180);
    const normalizedDestination = sanitizePlain(destination, 120);
    const normalizedDescription = sanitizeText(description, 4000);
    const normalizedDuration = Number(durationHours);
    const normalizedAdultPrice = Number(adultPrice);
    const normalizedChildPrice = childPrice === undefined || childPrice === '' ? undefined : Number(childPrice);

    if (
      !normalizedTitle ||
      !normalizedDescription ||
      !normalizedDestination ||
      !Number.isFinite(normalizedDuration) || normalizedDuration < 1 || normalizedDuration > 72 ||
      !Number.isFinite(normalizedAdultPrice) || normalizedAdultPrice <= 0 ||
      (normalizedChildPrice !== undefined && (!Number.isFinite(normalizedChildPrice) || normalizedChildPrice < 0))
    ) {
      return NextResponse.json(
        { error: 'Provide a title, destination, description, a duration between 1 and 72 hours, and valid prices.' },
        { status: 400 }
      );
    }

    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const tours: PartnerTourSubmission[] = record
      ? parseSettingValue<PartnerTourSubmission[]>(record.value, [])
      : [];

    const receipt = request.cookies.get(PARTNER_TOURS_COOKIE)?.value || crypto.randomBytes(32).toString('hex');
    const newTour: PartnerTourSubmission = {
      id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: normalizedTitle,
      destination: normalizedDestination,
      category: sanitizePlain(category || 'Sea & Snorkeling Trips', 120),
      durationHours: normalizedDuration,
      adultPrice: normalizedAdultPrice,
      childPrice: normalizedChildPrice,
      pickupHub: sanitizePlain(pickupHub, 250) || undefined,
      description: normalizedDescription,
      highlights: sanitizeText(highlights, 2000) || undefined,
      inclusions: sanitizeText(inclusions, 2000) || undefined,
      exclusions: sanitizeText(exclusions, 2000) || undefined,
      operatorNotes: sanitizeText(operatorNotes, 2000) || undefined,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerTokenHash: tokenHash(receipt),
    };

    const updated = [newTour, ...tours];

    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: serializeSettingValue(updated),
      },
      update: {
        value: serializeSettingValue(updated),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Experience proposal submitted for review successfully.',
      tour: { ...newTour, ownerTokenHash: undefined, operatorNotes: undefined },
    });
    partnerToursCookie(response, receipt);
    return response;
  } catch (err: any) {
    console.error('[partner-tours-post] error:', err);
    return NextResponse.json({ error: 'Failed to submit experience proposal' }, { status: 500 });
  }
}
