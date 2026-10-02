import type { Metadata } from 'next';
import SupportPageComponent from './SupportPage';

export const metadata: Metadata = {
  title: 'Support & Contact',
  description:
    'Contact TALAGO for help with your Egypt tour booking — WhatsApp, email and live support before, during and after your experience.',
  alternates: { canonical: '/support' },
  openGraph: { siteName: 'TALAGO' },
};

export default SupportPageComponent;
