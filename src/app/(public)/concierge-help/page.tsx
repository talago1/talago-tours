import ManagedContentPage from '@/components/public/ManagedContentPage';

export const dynamic = 'force-dynamic';

export default function ConciergeHelpPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <ManagedContentPage slug="concierge-help" searchParams={searchParams} />;
}
