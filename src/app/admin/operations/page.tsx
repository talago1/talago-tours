import { Suspense } from 'react';
import OperationsCalendarHeader from '@/components/admin/OperationsCalendarHeader';
import DailyManifestSheet from '@/components/admin/DailyManifestSheet';

function CalendarFallback() {
  return <div className="h-20 animate-pulse rounded-lg bg-white/5" />;
}

function ManifestFallback() {
  return <div className="h-96 animate-pulse rounded-lg bg-white/5" />;
}

export const metadata = {
  title: 'Operations Calendar | Talago Tours',
  description: 'Daily tour manifest and operations calendar.',
};

export default function OperationsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <Suspense fallback={<CalendarFallback />}>
          <OperationsCalendarHeader />
        </Suspense>
      </div>
      <Suspense fallback={<ManifestFallback />}>
        <DailyManifestSheet />
      </Suspense>
    </div>
  );
}
