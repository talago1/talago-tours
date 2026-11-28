import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getAuthoritativeContactSettings } from '@/lib/contactSettings';

const getCachedContactSettings = unstable_cache(
  async () => getAuthoritativeContactSettings(),
  ['public-contact-settings-v1'],
  { revalidate: 300, tags: ['settings'] }
);

export async function GET() {
  try {
    const contact = await getCachedContactSettings();

    return NextResponse.json(contact, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
