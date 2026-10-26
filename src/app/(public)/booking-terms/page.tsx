import ManagedContentPage from '@/components/public/ManagedContentPage';

export const dynamic = 'force-dynamic';

export default function BookingTermsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <ManagedContentPage slug="booking-terms" searchParams={searchParams} />;
}
