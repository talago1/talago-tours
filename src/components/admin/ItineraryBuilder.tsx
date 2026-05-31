'use client';

import type { ItineraryMilestone, IconToken, LanguageCode } from '@/types/itinerary';
import { ICON_MAP, ICON_TOKENS, ICON_LABELS, createEmptyMilestone } from '@/types/itinerary';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';

interface ItineraryBuilderProps {
  milestones: ItineraryMilestone[];
  activeLanguage: LanguageCode;
  errors: Record<string, string>;
  onChange: (milestones: ItineraryMilestone[]) => void;
}

export default function ItineraryBuilder({ milestones, activeLanguage, errors, onChange }: ItineraryBuilderProps) {
  const add = () => {
    onChange([...milestones, createEmptyMilestone()]);
  };

  const update = (index: number, partial: Partial<ItineraryMilestone>) => {
    const next = milestones.map((m, i) => (i === index ? { ...m, ...partial } : m));
    onChange(next);
  };

  const updateTitle = (index: number, value: string) => {
    const next = milestones.map((m, i) => {
      if (i !== index) return m;
      return { ...m, title: { ...m.title, [activeLanguage]: value } };
    });
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(milestones.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...milestones];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveDown = (index: number) => {
    if (index >= milestones.length - 1) return;
    const next = [...milestones];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  const single = milestones.length <= 1;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">Itinerary</h2>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary-forest text-white rounded-lg hover:bg-secondary-forest/90 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Add Milestone
        </button>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, i) => {
          const Icon = ICON_MAP[milestone.iconToken];
          const errKey = `itinerary.${i}.timeTag`;
          const hasError = !!errors[errKey];

          return (
            <div
              key={milestone.id}
              className={`relative border rounded-lg p-4 bg-neutral-light transition-colors duration-200 ${
                hasError ? 'border-red-400' : 'border-gray-200'
              }`}
            >
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-secondary-forest text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time Tag</label>
                  <input
                    type="text"
                    value={milestone.timeTag}
                    onChange={(e) => update(i, { timeTag: e.target.value })}
                    placeholder="e.g. 08:30 AM"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 ${
                      hasError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {hasError && (
                    <p className="text-xs text-red-500 mt-1">{errors[errKey]}</p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                  <div className="relative">
                    <select
                      value={milestone.iconToken}
                      onChange={(e) => update(i, { iconToken: e.target.value as IconToken })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50 appearance-none bg-white pr-10"
                    >
                      {ICON_TOKENS.map((token) => (
                        <option key={token} value={token}>
                          {ICON_LABELS[token]}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Title ({activeLanguage.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={milestone.title[activeLanguage]}
                    onChange={(e) => updateTitle(i, e.target.value)}
                    placeholder={activeLanguage === 'en' ? 'e.g. Hotel Pickup' : `Enter ${activeLanguage.toUpperCase()} title`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-coral/50"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-1 pt-5 justify-end">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={single || i === 0}
                    className="p-1.5 text-gray-400 hover:text-secondary-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={single || i === milestones.length - 1}
                    className="p-1.5 text-gray-400 hover:text-secondary-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    title="Remove milestone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {milestones.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center py-6">
            No itinerary milestones added. Click &quot;Add Milestone&quot; to build the tour program.
          </p>
        )}
      </div>
    </section>
  );
}
