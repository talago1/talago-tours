import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function MyBookingsPage() {
  permanentRedirect('/account?tab=bookings');
}
