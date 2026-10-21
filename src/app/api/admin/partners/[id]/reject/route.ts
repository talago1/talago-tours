import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import type { PartnerApplication } from '@/app/api/public/partners/apply/route';

const SETTINGS_KEY = 'partner_applications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 });
    }

    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch {
      // optional body
    }

    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const applications: PartnerApplication[] = record
      ? parseSettingValue<PartnerApplication[]>(record.value, [])
      : [];

    let targetApp: PartnerApplication | undefined;
    const updated = applications.map((app) => {
      if (app.id === id) {
        targetApp = { ...app, status: 'DECLINED' };
        return targetApp;
      }
      return app;
    });

    if (!targetApp) {
      return NextResponse.json({ error: 'Partner application not found' }, { status: 404 });
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
      message: `Partner application for ${targetApp.companyName} has been declined.`,
      application: targetApp,
      reason,
    });
  } catch (err: any) {
    console.error('[partner-reject] error:', err);
    return NextResponse.json({ error: 'Failed to decline application' }, { status: 500 });
  }
}
