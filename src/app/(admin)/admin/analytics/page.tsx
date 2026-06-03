import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics Dashboard | Talago Tours',
  description: 'Executive summary metrics, channel attribution, and revenue reporting.',
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <AnalyticsDashboard />
    </div>
  );
}
