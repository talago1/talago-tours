'use client';

import type { LanguageCode, TranslationEntry } from '@/types/tourBuilder';

interface LocalizedPanelProps {
  language: LanguageCode;
  data: TranslationEntry;
  isEnglish: boolean;
  errors: Record<string, string>;
  onChange: (data: TranslationEntry) => void;
}

export default function LocalizedPanel({
  language,
  data,
  isEnglish,
  errors,
  onChange,
}: LocalizedPanelProps) {
  const addPolicy = () => {
    onChange({
      ...data,
      cancellationPolicies: [...data.cancellationPolicies, ''],
    });
  };

  const updatePolicy = (index: number, value: string) => {
    const updated = [...data.cancellationPolicies];
    updated[index] = value;
    onChange({ ...data, cancellationPolicies: updated });
  };

  const removePolicy = (index: number) => {
    onChange({
      ...data,
      cancellationPolicies: data.cancellationPolicies.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Title {isEnglish && <span className="text-red-400">*</span>}
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder={`Tour title (${language.toUpperCase()})`}
          className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
            errors[`translations.${language}.title`] ? 'border-red-500/50' : 'border-white/10'
          } bg-[#070F1E] focus:border-[#00E5FF]`}
        />
        {errors[`translations.${language}.title`] && (
          <p className="mt-1 text-xs text-red-400">
            {errors[`translations.${language}.title`]}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Description {isEnglish && <span className="text-red-400">*</span>}
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder={`Tour description (${language.toUpperCase()})`}
          rows={4}
          className={`w-full resize-y rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
            errors[`translations.${language}.description`] ? 'border-red-500/50' : 'border-white/10'
          } bg-[#070F1E] focus:border-[#00E5FF]`}
        />
        {errors[`translations.${language}.description`] && (
          <p className="mt-1 text-xs text-red-400">
            {errors[`translations.${language}.description`]}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Cancellation Policies
        </label>
        {data.cancellationPolicies.map((policy, index) => (
          <div key={index} className="mb-2 flex gap-2">
            <input
              type="text"
              value={policy}
              onChange={(e) => updatePolicy(index, e.target.value)}
              placeholder={`Policy ${index + 1}`}
              className="flex-1 rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
            />
            <button
              type="button"
              onClick={() => removePolicy(index)}
              className="rounded-2xl px-4 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPolicy}
          className="mt-1 rounded-2xl border border-[#00E5FF]/30 px-5 py-2.5 text-sm font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/10"
        >
          + Add Policy
        </button>
      </div>
    </div>
  );
}
