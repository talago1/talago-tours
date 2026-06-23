import { Suspense } from 'react';
import OperationsCalendarHeader from '@/components/admin/OperationsCalendarHeader';
import DailyManifestSheet from '@/components/admin/DailyManifestSheet';
import OperationsPricingGrid from '@/components/admin/OperationsPricingGrid';

export const metadata = {
  title: 'Operations Control | Talago Tours',
  description: 'Daily manifest, operations calendar, and pricing management.',
};

export default function OperationsPage() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <Suspense fallback={<div className="h-40 rounded-xl bg-[#0B1528] border border-white/5" />}>
        <div className="mb-6">
          <OperationsCalendarHeader />
        </div>
      </Suspense>
      <Suspense fallback={<div className="h-64 rounded-xl bg-[#0B1528] border border-white/5" />}>
        <DailyManifestSheet />
      </Suspense>
      <OperationsPricingGrid />
    </div>
  );
}
