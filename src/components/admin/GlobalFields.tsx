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
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Tour Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={values.slug}
            onChange={(e) => update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="my-tour-name"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
              errors.slug ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.slug && (
            <p className="mt-1 text-xs text-red-500">{errors.slug}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Price (USD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.basePriceUSD || ''}
            onChange={(e) => update({ basePriceUSD: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
              errors.basePriceUSD ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.basePriceUSD && (
            <p className="mt-1 text-xs text-red-500">{errors.basePriceUSD}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (hours)
          </label>
          <input
            type="number"
            min="0"
            value={values.durationHours || ''}
            onChange={(e) => update({ durationHours: parseInt(e.target.value) || 0 })}
            placeholder="4"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
              errors.durationHours ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.durationHours && (
            <p className="mt-1 text-xs text-red-500">{errors.durationHours}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Capacity
          </label>
          <input
            type="number"
            min="0"
            value={values.maxCapacity || ''}
            onChange={(e) => update({ maxCapacity: parseInt(e.target.value) || 0 })}
            placeholder="20"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
              errors.maxCapacity ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.maxCapacity && (
            <p className="mt-1 text-xs text-red-500">{errors.maxCapacity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tour Type
          </label>
          <select
            value={values.tourType}
            onChange={(e) => update({ tourType: e.target.value as TourType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 bg-white"
          >
            <option value="SHARED">Shared</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zone
          </label>
          <select
            value={values.zoneId}
            onChange={(e) => update({ zoneId: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 bg-white ${
              errors.zoneId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          {errors.zoneId && (
            <p className="mt-1 text-xs text-red-500">{errors.zoneId}</p>
          )}
        </div>
      </div>
    </section>
  );
}
