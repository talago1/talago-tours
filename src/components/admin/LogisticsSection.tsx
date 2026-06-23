'use client';

import { useState, useRef } from 'react';
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

  // Parse pipe-separated pickupTime string into an array of individual times
  const timeSlots: string[] = values.pickupTime
    ? values.pickupTime.split('|').map((t) => t.trim()).filter(Boolean)
    : [];

  const [draftTime, setDraftTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addSlot = () => {
    const val = draftTime.trim();
    if (!val || timeSlots.includes(val)) {
      setDraftTime('');
      return;
    }
    const updated = [...timeSlots, val].join('|');
    update({ pickupTime: updated });
    setDraftTime('');
    inputRef.current?.focus();
  };

  const removeSlot = (slot: string) => {
    const updated = timeSlots.filter((t) => t !== slot).join('|');
    update({ pickupTime: updated });
  };

  return (
    <section className="mb-6 rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#00E5FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h2 className="text-lg font-black text-white">Logistics &amp; Tiered Pricing Support</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-300 mb-1">
            What to Bring / Important Information
          </label>
          <textarea
            rows={4}
            value={values.whatToBring}
            onChange={(e) => update({ whatToBring: e.target.value })}
            placeholder="Swimsuit, towel, sunscreen, comfortable shoes, camera..."
            className={`w-full resize-y rounded-2xl border bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF] ${
              errors.whatToBring ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {errors.whatToBring && (
            <p className="mt-1 text-xs text-red-500">{errors.whatToBring}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1">
            Pickup / Meeting Point Description
          </label>
          <input
            type="text"
            value={values.pickupDescription}
            onChange={(e) => update({ pickupDescription: e.target.value })}
            placeholder="e.g. Main entrance of Hurghada Marina"
            className={`w-full rounded-2xl border bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF] ${
              errors.pickupDescription ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {errors.pickupDescription && (
            <p className="mt-1 text-xs text-red-500">{errors.pickupDescription}</p>
          )}
        </div>

        {/* Pickup Time Slots — multi-value tag input */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-1">
            Available Pickup Times
            <span className="ml-1 text-xs font-normal text-slate-500">(customers will choose one)</span>
          </label>

          {/* Tag list */}
          {timeSlots.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {timeSlots.map((slot) => (
                <span
                  key={slot}
                  className="flex items-center gap-1.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1 text-sm font-semibold text-[#00E5FF]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {slot}
                  <button
                    type="button"
                    onClick={() => removeSlot(slot)}
                    className="ml-0.5 text-slate-400 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${slot}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add new slot */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addSlot(); }
              }}
              placeholder="e.g. 07:00 AM  →  press Enter"
              className="flex-1 rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
            />
            <button
              type="button"
              onClick={addSlot}
              className="rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-4 py-3 text-sm font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors"
            >
              Add
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Add one slot at a time. Example: &quot;07:00 AM&quot;, &quot;08:30 AM&quot;, &quot;09:00 AM&quot;
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-300 mb-1">
            Cancellation Policy
          </label>
          <textarea
            rows={3}
            value={values.cancellationPolicy}
            onChange={(e) => update({ cancellationPolicy: e.target.value })}
            placeholder="Free cancellation up to 24 hours before pickup..."
            className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-300 mb-3">
            Hotel Pickup
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={values.hotelPickupIncluded}
              onChange={(e) => update({ hotelPickupIncluded: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00E5FF]/30 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00E5FF]" />
            <span className="ml-3 text-sm text-slate-300">
              {values.hotelPickupIncluded ? 'Hotel pickup included' : 'No hotel pickup'}
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
