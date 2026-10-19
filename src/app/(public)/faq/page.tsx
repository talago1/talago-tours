import type { Metadata } from 'next';
import FAQPageComponent from './FAQPage';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description:
    'Answers to common questions about booking tours and experiences with TALAGO — payments, pickup, cancellation, languages and support.',
  alternates: { canonical: '/faq' },
  openGraph: { siteName: 'TALAGO' },
};

export default FAQPageComponent;
