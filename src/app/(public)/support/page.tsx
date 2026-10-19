import type { Metadata } from 'next';
import SupportPageComponent from './SupportPage';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, DEFAULT_SETTINGS } from '@/lib/systemSettings';
import type { SystemSettings } from '@/types/settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Support & Contact',
  description:
    'Contact TALAGO for help with your tour booking — live concierge assistance before, during and after your experience.',
  alternates: { canonical: '/support' },
  openGraph: { siteName: 'TALAGO' },
};

export default async function SupportPage() {
  const contactRecord = await prisma.systemSetting.findUnique({
    where: { key: 'contact' },
  });

  const contactSettings = contactRecord
    ? parseSettingValue<SystemSettings['contact']>(contactRecord.value, DEFAULT_SETTINGS.contact)
    : DEFAULT_SETTINGS.contact;

  return <SupportPageComponent contactSettings={contactSettings} />;
}
