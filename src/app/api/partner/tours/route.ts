import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';

const SETTINGS_KEY = 'partner_tours';

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
}

export async function GET() {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const tours: PartnerTourSubmission[] = record
      ? parseSettingValue<PartnerTourSubmission[]>(record.value, [])
      : [];

    return NextResponse.json({ tours, total: tours.length });
  } catch (err: any) {
    console.error('[partner-tours-get] error:', err);
    return NextResponse.json({ error: 'Failed to fetch partner tours' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (!title || !description || !destination || !adultPrice) {
      return NextResponse.json(
        { error: 'Missing required tour proposal fields' },
        { status: 400 }
      );
    }

    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const tours: PartnerTourSubmission[] = record
      ? parseSettingValue<PartnerTourSubmission[]>(record.value, [])
      : [];

    const newTour: PartnerTourSubmission = {
      id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      destination: destination.trim(),
      category: category || 'Sea & Snorkeling Trips',
      durationHours: Number(durationHours) || 6,
      adultPrice: Number(adultPrice),
      childPrice: childPrice !== undefined ? Number(childPrice) : undefined,
      pickupHub: pickupHub?.trim(),
      description: description.trim(),
      highlights: highlights?.trim(),
      inclusions: inclusions?.trim(),
      exclusions: exclusions?.trim(),
      operatorNotes: operatorNotes?.trim(),
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    return NextResponse.json({
      success: true,
      message: 'Experience proposal submitted for review successfully.',
      tour: newTour,
    });
  } catch (err: any) {
    console.error('[partner-tours-post] error:', err);
    return NextResponse.json({ error: 'Failed to submit experience proposal' }, { status: 500 });
  }
}
