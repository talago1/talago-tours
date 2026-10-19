import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import type { PartnerApplication } from '@/app/api/public/partners/apply/route';

const SETTINGS_KEY = 'partner_applications';

export async function GET() {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const applications: PartnerApplication[] = record
      ? parseSettingValue<PartnerApplication[]>(record.value, [])
      : [];

    return NextResponse.json({ applications, total: applications.length });
  } catch (err) {
    console.error('[admin-partner-apps] error fetching:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const applications: PartnerApplication[] = record
      ? parseSettingValue<PartnerApplication[]>(record.value, [])
      : [];

    const updated = applications.map((app) =>
      app.id === id ? { ...app, status } : app,
    );

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

    return NextResponse.json({ success: true, applications: updated });
  } catch (err) {
    console.error('[admin-partner-apps] error updating:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
