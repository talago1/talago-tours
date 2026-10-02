import type { Metadata } from 'next';
import FAQPageComponent from './FAQPage';

export const metadata: Metadata = {
  title: 'Egypt Travel FAQ',
  description:
    'Answers to common questions about booking Egypt tours and experiences with TALAGO — payments, pickup, cancellation, languages and support.',
  alternates: { canonical: '/faq' },
  openGraph: { siteName: 'TALAGO' },
};

export default FAQPageComponent;
