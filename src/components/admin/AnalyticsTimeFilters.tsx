'use client';

const FILTERS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: 'month', label: 'Current Month' },
  { key: 'ytd', label: 'Year to Date' },
];

export default function AnalyticsTimeFilters({
  current,
  onChange,
}: {
  current: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            current === f.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
