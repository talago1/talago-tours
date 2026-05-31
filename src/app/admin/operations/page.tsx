import OperationsCalendarHeader from '@/components/admin/OperationsCalendarHeader';
import DailyManifestSheet from '@/components/admin/DailyManifestSheet';

export const metadata = {
  title: 'Operations Calendar | Talago Tours',
  description: 'Daily tour manifest and operations calendar.',
};

export default function OperationsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <OperationsCalendarHeader />
      </div>
      <DailyManifestSheet />
    </div>
  );
}
