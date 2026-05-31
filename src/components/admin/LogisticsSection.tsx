'use client';

import type { LogisticsFields } from '@/types/tourBuilder';

interface LogisticsSectionProps {
  values: LogisticsFields;
  errors: Record<string, string>;
  onChange: (values: LogisticsFields) => void;
}

export default function LogisticsSection({ values, errors, onChange }: LogisticsSectionProps) {
  const update = (partial: Partial<LogisticsFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-800">Logistics & Operations</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What to Bring / Important Information
          </label>
          <textarea
            rows={4}
            value={values.whatToBring}
            onChange={(e) => update({ whatToBring: e.target.value })}
            placeholder="Swimsuit, towel, sunscreen, comfortable shoes, camera..."
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 resize-y ${
              errors.whatToBring ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.whatToBring && (
            <p className="mt-1 text-xs text-red-500">{errors.whatToBring}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pickup / Meeting Point Description
          </label>
          <input
            type="text"
            value={values.pickupDescription}
            onChange={(e) => update({ pickupDescription: e.target.value })}
            placeholder="e.g. Main entrance of Hurghada Marina"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
              errors.pickupDescription ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.pickupDescription && (
            <p className="mt-1 text-xs text-red-500">{errors.pickupDescription}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hotel Pickup
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={values.hotelPickupIncluded}
              onChange={(e) => update({ hotelPickupIncluded: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-coral/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-forest" />
            <span className="ml-3 text-sm text-gray-600">
              {values.hotelPickupIncluded ? 'Hotel pickup included' : 'No hotel pickup'}
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
