import ManagedContentPage from '@/components/public/ManagedContentPage';

export const dynamic = 'force-dynamic';

export default function SafetyPoliciesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  return <ManagedContentPage slug="safety-policies" searchParams={searchParams} />;
}
