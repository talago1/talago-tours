'use client';

import { Sparkles, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { MarketingFields } from '@/types/tourBuilder';

interface HighlightsSectionProps {
  values: MarketingFields;
  languageLabel?: string;
  errors: Record<string, string>;
  onChange: (values: MarketingFields) => void;
}

type ListKey = 'highlights' | 'inclusions' | 'exclusions';

const LIST_CONFIG: Record<ListKey, { label: string; placeholder: string; icon: React.ElementType; color: string; badgeBg: string }> = {
  highlights: {
    label: 'Key Highlights',
    placeholder: 'e.g. 50km desert quad biking to Bedouin village',
    icon: Sparkles,
    color: 'text-[#EAB308]',
    badgeBg: 'bg-[#EAB308]/10 border-[#EAB308]/30',
  },
  inclusions: {
    label: "What's Included (Inclusions)",
    placeholder: 'e.g. Quad bike, Helmet, Bedouin tea, Hotel transfer',
    icon: CheckCircle,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  exclusions: {
    label: "What's Not Included (Exclusions)",
    placeholder: 'e.g. Scarf & Goggles ($3), Gratuities / Tips',
    icon: XCircle,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
  },
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
  const Icon = config.icon;

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
    <div className="flex-1 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <label className="text-sm font-bold text-white">{config.label}</label>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black text-slate-400">
            {items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={add}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition hover:scale-105 ${config.badgeBg} ${config.color}`}
        >
          <Plus className="h-3 w-3" />
          Add Item
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
              className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#06B6D4] placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-500 italic py-2">No items added yet. Click &quot;Add Item&quot; to include details.</p>
        )}
      </div>
    </div>
  );
}

export default function HighlightsSection({ values, languageLabel, errors, onChange }: HighlightsSectionProps) {
  const update = (partial: Partial<MarketingFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20 mb-6">
      <div className="mb-5">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#00E5FF]" />
          Marketing &amp; Value Points (Highlights, Inclusions, Exclusions) {languageLabel && <span className="text-[#00E5FF] text-sm font-bold ml-1">({languageLabel})</span>}
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Manage everything included and excluded in the tour package with full add/remove/edit controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
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
        <p className="mt-4 text-xs text-rose-400">
          {Object.entries(errors)
            .filter(([k]) => k.startsWith('marketing.'))
            .map(([, v]) => v)
            .join(', ')}
        </p>
      )}
    </section>
  );
}

