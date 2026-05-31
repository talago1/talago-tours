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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title {isEnglish && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder={`Tour title (${language.toUpperCase()})`}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
            errors[`translations.${language}.title`] ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors[`translations.${language}.title`] && (
          <p className="mt-1 text-xs text-red-500">
            {errors[`translations.${language}.title`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description {isEnglish && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder={`Tour description (${language.toUpperCase()})`}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
            errors[`translations.${language}.description`] ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors[`translations.${language}.description`] && (
          <p className="mt-1 text-xs text-red-500">
            {errors[`translations.${language}.description`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cancellation Policies
        </label>
        {data.cancellationPolicies.map((policy, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={policy}
              onChange={(e) => updatePolicy(index, e.target.value)}
              placeholder={`Policy ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50"
            />
            <button
              type="button"
              onClick={() => removePolicy(index)}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPolicy}
          className="mt-1 px-4 py-2 text-sm font-medium text-primary-coral border border-primary-coral/30 rounded-lg hover:bg-primary-coral/5 transition-colors duration-200"
        >
          + Add Policy
        </button>
      </div>
    </div>
  );
}
