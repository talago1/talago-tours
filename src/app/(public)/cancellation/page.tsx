import type { Metadata } from 'next';
import CancellationContent from './CancellationContent';

export const metadata: Metadata = {
  title: 'Cancellation Policy — TALAGO',
  description: 'TALAGO flexible cancellation and refund policy for tour bookings.',
};

export default function CancellationPolicyPage() {
  return <CancellationContent />;
}
