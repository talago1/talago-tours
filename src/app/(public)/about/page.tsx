import ManagedContentPage from '@/components/public/ManagedContentPage';

export const dynamic = 'force-dynamic';

export default function AboutPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <ManagedContentPage slug="about" searchParams={searchParams} />;
}
