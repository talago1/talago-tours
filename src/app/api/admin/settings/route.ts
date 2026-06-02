import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const DEFAULT_SETTINGS = {
  contact: {
    whatsappNumber: '+201234567890',
    corporateEmail: 'info@talago.com',
    socialLinks: {
      instagram: 'https://instagram.com/talago',
      facebook: 'https://facebook.com/talago',
      twitter: 'https://twitter.com/talago',
    },
  },
  financial: {
    baseCurrency: 'USD',
    exchangeRates: {
      USD: 1,
      EUR: 0.92,
      RUB: 92.5,
      GBP: 0.79,
      PLN: 4.05,
      EGP: 48.5,
    },
  },
  system: {
    maintenanceMode: false,
    paymentGateways: {
      paymob: true,
      fawry: false,
    },
  },
};

export type SystemSettingsPayload = typeof DEFAULT_SETTINGS;

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      settings: settingsMap,
      defaults: DEFAULT_SETTINGS,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 },
      );
    }

    const validKeys = ['contact', 'financial', 'system', 'banners'];
    if (!validKeys.includes(key)) {
      return NextResponse.json(
        { error: `Invalid setting key. Must be one of: ${validKeys.join(', ')}` },
        { status: 400 },
      );
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    return NextResponse.json(setting);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      const validKeys = ['contact', 'financial', 'system', 'banners'];
      if (!validKeys.includes(key)) continue;
      await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 },
    );
  }
}
