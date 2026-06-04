import { Suspense } from 'react';
import OperationsCalendarHeader from '@/components/admin/OperationsCalendarHeader';
import DailyManifestSheet from '@/components/admin/DailyManifestSheet';

export const metadata = {
  title: 'Operations Calendar | Talago Tours',
  description: 'Daily tour manifest and operations calendar.',
};

export default function OperationsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Suspense fallback={<div className="mb-6 h-40 rounded-xl bg-[#0B1528] border border-white/5" />}>
        <div className="mb-6">
          <OperationsCalendarHeader />
        </div>
      </Suspense>
      <Suspense fallback={<div className="h-64 rounded-xl bg-[#0B1528] border border-white/5" />}>
        <DailyManifestSheet />
      </Suspense>
    </div>
  );
}
