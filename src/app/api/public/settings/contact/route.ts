import { NextResponse } from 'next/server';
import { getAuthoritativeContactSettings } from '@/lib/contactSettings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contact = await getAuthoritativeContactSettings();

    return NextResponse.json(contact, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[public/settings/contact] error:', err);
    return NextResponse.json({
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+201222434602',
      corporateEmail: 'support@talago-tours.com',
      showWhatsApp: true,
      showEmail: true,
      showPhone: false,
    });
  }
}
