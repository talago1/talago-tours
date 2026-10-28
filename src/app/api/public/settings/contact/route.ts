import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import { DEFAULT_SETTINGS } from '@/lib/systemSettings';

// 60-second cache — lightweight public endpoint used by widgets on every page
export const revalidate = 60;

export async function GET() {
  try {
    const record = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
    const contact = record
      ? parseSettingValue(record.value as string, DEFAULT_SETTINGS.contact)
      : DEFAULT_SETTINGS.contact;

    return NextResponse.json(
      {
        whatsappNumber: contact.whatsappNumber ?? DEFAULT_SETTINGS.contact.whatsappNumber,
        phoneNumber:    contact.phoneNumber    ?? DEFAULT_SETTINGS.contact.phoneNumber,
        corporateEmail: contact.corporateEmail ?? DEFAULT_SETTINGS.contact.corporateEmail,
        showWhatsApp:   contact.showWhatsApp   ?? DEFAULT_SETTINGS.contact.showWhatsApp,
        showPhone:      contact.showPhone      ?? DEFAULT_SETTINGS.contact.showPhone,
        showEmail:      contact.showEmail      ?? DEFAULT_SETTINGS.contact.showEmail,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.error('[public/settings/contact] error:', err);
    // Always return a usable fallback so widgets never break
    return NextResponse.json(DEFAULT_SETTINGS.contact);
  }
}

