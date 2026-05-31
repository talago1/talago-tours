'use client';

import type { PricingFields } from '@/types/tourBuilder';

interface PricingSectionProps {
  values: PricingFields;
  errors: Record<string, string>;
  onChange: (values: PricingFields) => void;
}

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-10 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-coral/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-forest" />
      <span className="ml-3 text-sm text-gray-600">{label}</span>
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  error,
  prefix,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
  error?: string;
  prefix?: string;
}) {
  return (
    <div>
      {prefix ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>
          <input
            type="number"
            min={min ?? 0}
            step="0.01"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
      ) : (
        <input
          type="number"
          min={min ?? 0}
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function PricingSection({ values, errors, onChange }: PricingSectionProps) {
  const update = (partial: Partial<PricingFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-800">Pricing & Age Tiers</h2>
      </div>

      <div className="space-y-5">
        {/* Row 1 — Adult (always visible, required) */}
        <div className="pb-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Adult Price (USD)</label>
          <div className="max-w-xs">
            <NumberInput
              value={values.adultPrice}
              onChange={(v) => update({ adultPrice: v })}
              placeholder="0.00"
              min={0}
              prefix="$"
              error={errors.adultPrice}
            />
          </div>
        </div>

        {/* Row 2 — Child Tier */}
        <div className="pb-4 border-b border-gray-100">
          <Toggle
            enabled={values.childEnabled}
            onChange={(v) => update({ childEnabled: v })}
            label="Enable Child Pricing"
          />

          {values.childEnabled && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Child Price (USD)</label>
                <NumberInput
                  value={values.childPrice}
                  onChange={(v) => update({ childPrice: v })}
                  placeholder="0.00"
                  prefix="$"
                  error={errors.childPrice}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Min Age</label>
                <NumberInput
                  value={values.childMinAge}
                  onChange={(v) => update({ childMinAge: v })}
                  placeholder="3"
                  error={errors.childMinAge}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Max Age</label>
                <NumberInput
                  value={values.childMaxAge}
                  onChange={(v) => update({ childMaxAge: v })}
                  placeholder="11"
                  error={errors.childMaxAge}
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 3 — Infant Tier */}
        <div className="pb-4 border-b border-gray-100">
          <Toggle
            enabled={values.infantEnabled}
            onChange={(v) => update({ infantEnabled: v })}
            label="Enable Infant Pricing"
          />

          {values.infantEnabled && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Infant Price (USD)</label>
                <NumberInput
                  value={values.infantPrice}
                  onChange={(v) => update({ infantPrice: v })}
                  placeholder="0.00"
                  prefix="$"
                  error={errors.infantPrice}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Min Age</label>
                <NumberInput
                  value={values.infantMinAge}
                  onChange={(v) => update({ infantMinAge: v })}
                  placeholder="0"
                  error={errors.infantMinAge}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Max Age</label>
                <NumberInput
                  value={values.infantMaxAge}
                  onChange={(v) => update({ infantMaxAge: v })}
                  placeholder="2"
                  error={errors.infantMaxAge}
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 4 — Age Restrictions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Important Age &amp; Safety Restrictions
          </label>
          <textarea
            rows={3}
            value={values.ageRestrictionsNotes}
            onChange={(e) => update({ ageRestrictionsNotes: e.target.value })}
            placeholder="Minimum age for driving Quad Safari is 16 years. Children under 6 are not allowed."
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 resize-y ${
              errors.ageRestrictionsNotes ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.ageRestrictionsNotes && (
            <p className="mt-1 text-xs text-red-500">{errors.ageRestrictionsNotes}</p>
          )}
        </div>
      </div>
    </section>
  );
}
