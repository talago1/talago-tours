import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  isSettingsKey,
  mergeSystemSettings,
  parseSettingValue,
  serializeSettingValue,
  SETTINGS_KEYS,
} from '@/lib/systemSettings';

const DEFAULT_SETTINGS = {
  contact: {
    whatsappNumber: '+2010222434602',
    corporateEmail: 'tala.tour@outlook.com',
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
  banners: {
    heroBackground: '',
    splitSectionLeft: '',
    splitSectionRight: '',
    toursCatalogBackground: '',
    destinationsBackground: '',
    bookingCheckoutBackground: '',
    conciergePickImage: '',
    conciergePickTitle: 'Private yacht sunrise to Giftun Island',
    conciergePickDescription: 'Champagne breakfast, reef snorkel guide, and flexible return timing.',
    aboutPhilosophyImage: '',
    assets: [],
  },
};

export type SystemSettingsPayload = typeof DEFAULT_SETTINGS;

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = parseSettingValue(s.value, s.value);
    }

    return NextResponse.json({
      settings: mergeSystemSettings(settingsMap),
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

    if (!isSettingsKey(key)) {
      return NextResponse.json(
        { error: `Invalid setting key. Must be one of: ${SETTINGS_KEYS.join(', ')}` },
        { status: 400 },
      );
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: serializeSettingValue(value) },
      update: { value: serializeSettingValue(value) },
    });

    return NextResponse.json({
      ...setting,
      value: parseSettingValue(setting.value, setting.value),
    });
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
      if (!isSettingsKey(key)) continue;
      await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: serializeSettingValue(value) },
        update: { value: serializeSettingValue(value) },
      });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = parseSettingValue(s.value, s.value);
    }

    return NextResponse.json({ settings: mergeSystemSettings(settingsMap) });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 },
    );
  }
}
