'use client';

import type { GlobalFields, TourType } from '@/types/tourBuilder';

interface GlobalFieldsProps {
  values: GlobalFields;
  zones: { id: string; name: string }[];
  errors: Record<string, string>;
  onChange: (values: GlobalFields) => void;
}

export default function GlobalFields({
  values,
  zones,
  errors,
  onChange,
}: GlobalFieldsProps) {
  const update = (partial: Partial<GlobalFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
      <h2 className="mb-4 text-lg font-black text-white">
        Tour Details
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Slug
          </label>
          <input
            type="text"
            value={values.slug}
            onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="my-tour-name"
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
              errors.slug ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E] focus:border-[#00E5FF]`}
          />
          {errors.slug && (
            <p className="mt-1 text-xs text-red-400">{errors.slug}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Base Price (USD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.basePriceUSD || ''}
            onChange={(e) => update({ basePriceUSD: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
              errors.basePriceUSD ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E] focus:border-[#00E5FF]`}
          />
          {errors.basePriceUSD && (
            <p className="mt-1 text-xs text-red-400">{errors.basePriceUSD}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Duration (hours)
          </label>
          <input
            type="number"
            min="0"
            value={values.durationHours || ''}
            onChange={(e) => update({ durationHours: parseInt(e.target.value) || 0 })}
            placeholder="4"
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
              errors.durationHours ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E] focus:border-[#00E5FF]`}
          />
          {errors.durationHours && (
            <p className="mt-1 text-xs text-red-400">{errors.durationHours}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Max Capacity
          </label>
          <input
            type="number"
            min="0"
            value={values.maxCapacity || ''}
            onChange={(e) => update({ maxCapacity: parseInt(e.target.value) || 0 })}
            placeholder="20"
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
              errors.maxCapacity ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E] focus:border-[#00E5FF]`}
          />
          {errors.maxCapacity && (
            <p className="mt-1 text-xs text-red-400">{errors.maxCapacity}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Tour Type
          </label>
          <select
            value={values.tourType}
            onChange={(e) => update({ tourType: e.target.value as TourType })}
            className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
          >
            <option value="SHARED">Shared</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Zone
          </label>
          <select
            value={values.zoneId}
            onChange={(e) => update({ zoneId: e.target.value })}
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none ${
              errors.zoneId ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E] focus:border-[#00E5FF]`}
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          {errors.zoneId && (
            <p className="mt-1 text-xs text-red-400">{errors.zoneId}</p>
          )}
        </div>
      </div>
    </section>
  );
}
