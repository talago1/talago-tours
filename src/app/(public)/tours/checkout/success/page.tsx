import type { Metadata } from 'next';
import CheckoutSuccessContent from './CheckoutSuccessContent';

export const metadata: Metadata = {
  title: 'Booking Confirmed | Talago Tours',
  description: 'Your tour booking has been confirmed. Our team will contact you via WhatsApp shortly.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Booking Confirmed | Talago Tours',
    description: 'Your tour booking has been confirmed.',
  },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return <CheckoutSuccessContent token={searchParams.token || ''} />;
}
