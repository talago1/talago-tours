import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import type { PartnerTourSubmission } from '@/app/api/partner/tours/route';

const SETTINGS_KEY = 'partner_tours';

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
    console.error('[admin-partner-tours-get] error:', err);
    return NextResponse.json({ error: 'Failed to fetch partner tours' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Tour ID and status required' }, { status: 400 });
    }

    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const tours: PartnerTourSubmission[] = record
      ? parseSettingValue<PartnerTourSubmission[]>(record.value, [])
      : [];

    let updatedTour: PartnerTourSubmission | undefined;
    const updated = tours.map((t) => {
      if (t.id === id) {
        updatedTour = { ...t, status, updatedAt: new Date().toISOString() };
        return updatedTour;
      }
      return t;
    });

    if (!updatedTour) {
      return NextResponse.json({ error: 'Tour proposal not found' }, { status: 404 });
    }

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
      message: `Tour proposal status updated to ${status}.`,
      tours: updated,
    });
  } catch (err: any) {
    console.error('[admin-partner-tours-patch] error:', err);
    return NextResponse.json({ error: 'Failed to update partner tour' }, { status: 500 });
  }
}
