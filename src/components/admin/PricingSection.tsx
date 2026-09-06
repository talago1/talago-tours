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
      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00E5FF]/30 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E5FF]" />
      <span className="ml-3 text-sm text-slate-300">{label}</span>
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
          <input
            type="number"
            min={min ?? 0}
            step="0.01"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            className={`w-full pl-7 pr-3 py-2.5 rounded-2xl border bg-[#070F1E] text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF] ${
              error ? 'border-red-500' : 'border-white/10'
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
          className={`w-full px-3 py-2.5 rounded-2xl border bg-[#070F1E] text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF] ${
            error ? 'border-red-500' : 'border-white/10'
          }`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function PricingSection({ values, errors, onChange }: PricingSectionProps) {
  const update = (partial: Partial<PricingFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="mb-6 rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#00E5FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-black text-white">Pricing & Age Tiers</h2>
      </div>

      <div className="space-y-6">
        {/* Adult & Original Price */}
        <div className="pb-5 border-b border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1.5">
                Adult Price (USD) <span className="text-[#00E5FF]">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">The actual price charged per adult guest.</p>
              <NumberInput
                value={values.adultPrice}
                onChange={(v) => update({ adultPrice: v })}
                placeholder="0.00"
                min={0}
                prefix="$"
                error={errors.adultPrice}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1.5">
                Original / Compare-at Price (USD) <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">If set higher than adult price, it appears crossed out ($~~120~~).</p>
              <NumberInput
                value={values.originalPrice ?? 0}
                onChange={(v) => update({ originalPrice: v })}
                placeholder="0.00"
                min={0}
                prefix="$"
              />
            </div>
          </div>

          {/* Live Discount Calculator Preview */}
          {(values.originalPrice ?? 0) > values.adultPrice && values.adultPrice > 0 && (
            <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-[#FF5B00]/20 bg-[#FF5B00]/5 px-4 py-2.5">
              <span className="text-lg">🔥</span>
              <div className="text-xs">
                <span className="font-bold text-[#FF5B00]">Live Discount Preview: </span>
                <span className="font-medium text-slate-300">
                  Customers see <span className="line-through text-slate-500">${(values.originalPrice ?? 0).toFixed(0)}</span>{' '}
                  <span className="font-bold text-white">${values.adultPrice.toFixed(0)}</span> — Save{' '}
                  <strong className="text-emerald-400">
                    ${((values.originalPrice ?? 0) - values.adultPrice).toFixed(0)} ({Math.round((1 - values.adultPrice / (values.originalPrice ?? 1)) * 100)}% OFF)
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Child Tier */}
        <div className="pb-5 border-b border-white/10">
          <Toggle
            enabled={values.childEnabled}
            onChange={(v) => update({ childEnabled: v })}
            label="Enable Child Pricing"
          />

          {values.childEnabled && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Child Price (USD)</label>
                <NumberInput
                  value={values.childPrice}
                  onChange={(v) => update({ childPrice: v })}
                  placeholder="0.00"
                  prefix="$"
                  error={errors.childPrice}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Min Age</label>
                <NumberInput
                  value={values.childMinAge}
                  onChange={(v) => update({ childMinAge: v })}
                  placeholder="3"
                  error={errors.childMinAge}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Max Age</label>
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

        {/* Infant Tier */}
        <div className="pb-5 border-b border-white/10">
          <Toggle
            enabled={values.infantEnabled}
            onChange={(v) => update({ infantEnabled: v })}
            label="Enable Infant Pricing"
          />

          {values.infantEnabled && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Infant Price (USD)</label>
                <NumberInput
                  value={values.infantPrice}
                  onChange={(v) => update({ infantPrice: v })}
                  placeholder="0.00"
                  prefix="$"
                  error={errors.infantPrice}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Min Age</label>
                <NumberInput
                  value={values.infantMinAge}
                  onChange={(v) => update({ infantMinAge: v })}
                  placeholder="0"
                  error={errors.infantMinAge}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Max Age</label>
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

        {/* Age Restrictions */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1">
            Important Age &amp; Safety Restrictions
          </label>
          <textarea
            rows={3}
            value={values.ageRestrictionsNotes}
            onChange={(e) => update({ ageRestrictionsNotes: e.target.value })}
            placeholder="Minimum age for driving Quad Safari is 16 years. Children under 6 are not allowed."
            className={`w-full resize-y rounded-2xl border bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF] ${
              errors.ageRestrictionsNotes ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {errors.ageRestrictionsNotes && (
            <p className="mt-1 text-xs text-red-400">{errors.ageRestrictionsNotes}</p>
          )}
        </div>
      </div>
    </section>
  );
}
