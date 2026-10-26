import ManagedContentPage from '@/components/public/ManagedContentPage';

export const dynamic = 'force-dynamic';

export default function FAQPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <ManagedContentPage slug="faq" searchParams={searchParams} />;
}
