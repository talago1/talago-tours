'use client';

import type { MarketingFields } from '@/types/tourBuilder';

interface HighlightsSectionProps {
  values: MarketingFields;
  errors: Record<string, string>;
  onChange: (values: MarketingFields) => void;
}

type ListKey = 'highlights' | 'inclusions' | 'exclusions';

const LIST_CONFIG: Record<ListKey, { label: string; placeholder: string }> = {
  highlights: { label: 'Highlights', placeholder: 'Snorkel at vibrant coral reefs' },
  inclusions: { label: 'Inclusions', placeholder: 'Lunch, Guide, Equipment' },
  exclusions: { label: 'Exclusions', placeholder: 'Tipping, National Park Fees' },
};

function ListEditor({
  field,
  items,
  onChange,
}: {
  field: ListKey;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const config = LIST_CONFIG[field];

  const add = () => onChange([...items, '']);
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">{config.label}</label>
        <button
          type="button"
          onClick={add}
          className="text-xs px-3 py-1.5 bg-secondary-forest text-white rounded-lg hover:bg-secondary-forest/90 transition-colors duration-200"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={config.placeholder}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic">No items added.</p>
        )}
      </div>
    </div>
  );
}

export default function HighlightsSection({ values, errors, onChange }: HighlightsSectionProps) {
  const update = (partial: Partial<MarketingFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-800">Marketing & Value Points</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <ListEditor
          field="highlights"
          items={values.highlights}
          onChange={(items) => update({ highlights: items })}
        />
        <ListEditor
          field="inclusions"
          items={values.inclusions}
          onChange={(items) => update({ inclusions: items })}
        />
        <ListEditor
          field="exclusions"
          items={values.exclusions}
          onChange={(items) => update({ exclusions: items })}
        />
      </div>

      {Object.keys(errors).some((k) => k.startsWith('marketing.')) && (
        <p className="mt-2 text-xs text-red-500">
          {Object.entries(errors)
            .filter(([k]) => k.startsWith('marketing.'))
            .map(([, v]) => v)
            .join(', ')}
        </p>
      )}
    </section>
  );
}
