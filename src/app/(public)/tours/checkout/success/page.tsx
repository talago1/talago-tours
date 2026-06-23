import type { Metadata } from 'next';
import CheckoutSuccessContent from './CheckoutSuccessContent';

export const metadata: Metadata = {
  title: 'Booking Confirmed | Talago Tours',
  description: 'Your tour booking has been confirmed. Our team will contact you via WhatsApp shortly.',
  openGraph: {
    title: 'Booking Confirmed | Talago Tours',
    description: 'Your tour booking has been confirmed.',
  },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  return <CheckoutSuccessContent ref={searchParams.ref || ''} />;
}
