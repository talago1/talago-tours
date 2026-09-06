'use client';

import { useState } from 'react';
import type { ItineraryMilestone, IconToken, LanguageCode } from '@/types/itinerary';
import { ICON_MAP, ICON_TOKENS, ICON_LABELS, createEmptyMilestone } from '@/types/itinerary';
import { LANGUAGE_CODES, LANGUAGE_LABELS } from '@/types/tourBuilder';
import { ChevronUp, ChevronDown, Trash2, Plus, Clock, MapPin } from 'lucide-react';

interface ItineraryBuilderProps {
  milestones: ItineraryMilestone[];
  activeLanguage: LanguageCode;
  errors: Record<string, string>;
  onChange: (milestones: ItineraryMilestone[]) => void;
}

const LANG_FLAGS: Record<LanguageCode, string> = {
  en: '🇬🇧', de: '🇩🇪', ru: '🇷🇺', fr: '🇫🇷', it: '🇮🇹', pl: '🇵🇱', es: '🇪🇸',
};

export default function ItineraryBuilder({ milestones, activeLanguage, errors, onChange }: ItineraryBuilderProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(activeLanguage || 'en');

  const add = () => {
    onChange([...milestones, createEmptyMilestone()]);
  };

  const update = (index: number, partial: Partial<ItineraryMilestone>) => {
    const next = milestones.map((m, i) => (i === index ? { ...m, ...partial } : m));
    onChange(next);
  };

  const updateTitle = (index: number, lang: LanguageCode, value: string) => {
    const next = milestones.map((m, i) => {
      if (i !== index) return m;
      return { ...m, title: { ...m.title, [lang]: value } };
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
    <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#06B6D4]" />
            Tour Program &amp; Itinerary
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Define chronological steps, stops, and milestone titles across all 7 languages.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-4 py-2 text-sm font-bold text-[#06B6D4] transition hover:bg-[#06B6D4]/20"
        >
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      </div>

      {/* Language Selector for Milestone Titles */}
      {milestones.length > 0 && (
        <div className="mb-4 flex gap-1.5 flex-wrap items-center">
          <span className="text-xs font-bold text-slate-400 mr-2">Editing Language:</span>
          {LANGUAGE_CODES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setCurrentLang(lang)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                currentLang === lang
                  ? 'bg-[#06B6D4] text-[#070F1E]'
                  : 'border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {LANG_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.map((milestone, i) => {
          const Icon = ICON_MAP[milestone.iconToken] || MapPin;
          const errKey = `itinerary.${i}.timeTag`;
          const hasError = !!errors[errKey];
          const currentTitle = milestone.title?.[currentLang] || milestone.title?.en || '';

          return (
            <div
              key={milestone.id}
              className={`rounded-2xl border transition-all p-4 ${
                hasError
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Milestone Number & Time */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Step #{i + 1} Time Tag
                  </label>
                  <input
                    type="text"
                    value={milestone.timeTag}
                    onChange={(e) => update(i, { timeTag: e.target.value })}
                    placeholder="e.g. 08:30 AM"
                    className={`w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#06B6D4] placeholder:text-slate-600 ${
                      hasError ? 'border-red-500' : ''
                    }`}
                  />
                  {hasError && (
                    <p className="text-xs text-red-400 mt-1">{errors[errKey]}</p>
                  )}
                </div>

                {/* Icon Selector */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Activity Icon
                  </label>
                  <div className="relative">
                    <select
                      value={milestone.iconToken}
                      onChange={(e) => update(i, { iconToken: e.target.value as IconToken })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#06B6D4] appearance-none pr-10"
                    >
                      {ICON_TOKENS.map((token) => (
                        <option key={token} value={token}>
                          {ICON_LABELS[token]}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#06B6D4]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Localized Title */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Title ({LANG_FLAGS[currentLang]} {currentLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={currentTitle}
                    onChange={(e) => updateTitle(i, currentLang, e.target.value)}
                    placeholder={`e.g. Hotel Departure in ${currentLang.toUpperCase()}`}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#06B6D4] placeholder:text-slate-600"
                  />
                </div>

                {/* Action buttons */}
                <div className="md:col-span-2 flex items-center gap-1 justify-end pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={single || i === 0}
                    className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={single || i === milestones.length - 1}
                    className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-20 transition"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded-xl p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-slate-500">
              No itinerary milestones added yet. Click &quot;Add Milestone&quot; to build the step-by-step tour program.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

