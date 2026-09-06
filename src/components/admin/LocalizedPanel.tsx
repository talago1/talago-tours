'use client';

import { Sparkles, CheckCircle, XCircle, Plus, Trash2, ShieldAlert, MapPin, Backpack } from 'lucide-react';
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
  // Helper for list fields
  const getList = (key: 'highlights' | 'inclusions' | 'exclusions' | 'cancellationPolicies'): string[] => {
    return Array.isArray(data[key]) ? (data[key] as string[]) : [];
  };

  const updateList = (key: 'highlights' | 'inclusions' | 'exclusions' | 'cancellationPolicies', items: string[]) => {
    onChange({ ...data, [key]: items });
  };

  const addListItem = (key: 'highlights' | 'inclusions' | 'exclusions' | 'cancellationPolicies') => {
    const current = getList(key);
    updateList(key, [...current, '']);
  };

  const updateListItem = (key: 'highlights' | 'inclusions' | 'exclusions' | 'cancellationPolicies', index: number, value: string) => {
    const current = [...getList(key)];
    current[index] = value;
    updateList(key, current);
  };

  const removeListItem = (key: 'highlights' | 'inclusions' | 'exclusions' | 'cancellationPolicies', index: number) => {
    const current = getList(key).filter((_, i) => i !== index);
    updateList(key, current);
  };

  const highlights = getList('highlights');
  const inclusions = getList('inclusions');
  const exclusions = getList('exclusions');
  const policies = getList('cancellationPolicies');

  return (
    <div className="space-y-6">
      {/* 1. Core Titles & Text */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
            Tour Title ({language.toUpperCase()}) {isEnglish && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder={`Enter title in ${language.toUpperCase()}`}
            className={`w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none transition focus:border-[#00E5FF] ${
              errors[`translations.${language}.title`] ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E]`}
          />
          {errors[`translations.${language}.title`] && (
            <p className="mt-1 text-xs text-red-400">
              {errors[`translations.${language}.title`]}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
            Card Excerpt / Short Summary ({language.toUpperCase()})
          </label>
          <input
            type="text"
            value={data.cardExcerpt || ''}
            onChange={(e) => onChange({ ...data, cardExcerpt: e.target.value })}
            placeholder={`Catchy 1-2 sentence preview for search cards in ${language.toUpperCase()}`}
            className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none transition focus:border-[#00E5FF] placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
            Full Description ({language.toUpperCase()}) {isEnglish && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder={`Detailed tour overview and experience storytelling in ${language.toUpperCase()}`}
            rows={5}
            className={`w-full resize-y rounded-2xl border px-4 py-3 text-sm text-white outline-none transition focus:border-[#00E5FF] ${
              errors[`translations.${language}.description`] ? 'border-red-500/50' : 'border-white/10'
            } bg-[#070F1E] placeholder:text-slate-600`}
          />
          {errors[`translations.${language}.description`] && (
            <p className="mt-1 text-xs text-red-400">
              {errors[`translations.${language}.description`]}
            </p>
          )}
        </div>
      </div>

      {/* 2. Multilingual Marketing Value Points (Highlights, Inclusions, Exclusions) */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-6">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#EAB308]" />
          Marketing Points in {language.toUpperCase()} (Highlights, Inclusions, Exclusions)
        </h3>

        {/* Highlights */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#EAB308] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Key Highlights ({highlights.length})
            </label>
            <button
              type="button"
              onClick={() => addListItem('highlights')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#EAB308] bg-[#EAB308]/10 border border-[#EAB308]/30 px-3 py-1 rounded-full hover:bg-[#EAB308]/20 transition"
            >
              <Plus className="h-3 w-3" />
              Add Highlight
            </button>
          </div>
          <div className="space-y-2">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem('highlights', index, e.target.value)}
                  placeholder={`Highlight ${index + 1} in ${language.toUpperCase()}`}
                  className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeListItem('highlights', index)}
                  className="p-2 text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {highlights.length === 0 && (
              <p className="text-xs text-slate-500 italic">No highlights added in {language.toUpperCase()} yet.</p>
            )}
          </div>
        </div>

        {/* Inclusions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              What&apos;s Included ({inclusions.length})
            </label>
            <button
              type="button"
              onClick={() => addListItem('inclusions')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full hover:bg-emerald-500/20 transition"
            >
              <Plus className="h-3 w-3" />
              Add Inclusion
            </button>
          </div>
          <div className="space-y-2">
            {inclusions.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem('inclusions', index, e.target.value)}
                  placeholder={`Included item ${index + 1} in ${language.toUpperCase()}`}
                  className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeListItem('inclusions', index)}
                  className="p-2 text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {inclusions.length === 0 && (
              <p className="text-xs text-slate-500 italic">No inclusions added in {language.toUpperCase()} yet.</p>
            )}
          </div>
        </div>

        {/* Exclusions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              What&apos;s Not Included ({exclusions.length})
            </label>
            <button
              type="button"
              onClick={() => addListItem('exclusions')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full hover:bg-rose-500/20 transition"
            >
              <Plus className="h-3 w-3" />
              Add Exclusion
            </button>
          </div>
          <div className="space-y-2">
            {exclusions.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem('exclusions', index, e.target.value)}
                  placeholder={`Excluded item ${index + 1} in ${language.toUpperCase()}`}
                  className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeListItem('exclusions', index)}
                  className="p-2 text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {exclusions.length === 0 && (
              <p className="text-xs text-slate-500 italic">No exclusions added in {language.toUpperCase()} yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Multilingual Logistics & Policies */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Backpack className="h-4 w-4 text-[#06B6D4]" />
          Logistics &amp; Instructions in {language.toUpperCase()}
        </h3>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
            <Backpack className="h-3.5 w-3.5 text-[#06B6D4]" />
            What to Bring ({language.toUpperCase()})
          </label>
          <input
            type="text"
            value={data.whatToBring || ''}
            onChange={(e) => onChange({ ...data, whatToBring: e.target.value })}
            placeholder={`e.g. Passport, Sunglasses, Comfortable shoes (${language.toUpperCase()})`}
            className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#06B6D4]" />
            Pickup &amp; Transfer Details ({language.toUpperCase()})
          </label>
          <input
            type="text"
            value={data.pickupDescription || ''}
            onChange={(e) => onChange({ ...data, pickupDescription: e.target.value })}
            placeholder={`e.g. Pickup from hotel lobby 30 mins before start (${language.toUpperCase()})`}
            className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-[#EAB308]" />
            Cancellation Policy Note ({language.toUpperCase()})
          </label>
          <input
            type="text"
            value={data.cancellationPolicy || ''}
            onChange={(e) => onChange({ ...data, cancellationPolicy: e.target.value })}
            placeholder={`e.g. Free cancellation up to 24 hours before departure (${language.toUpperCase()})`}
            className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
          />
        </div>

        {/* Cancellation policies bullets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Cancellation Policy Bullet Points ({policies.length})
            </label>
            <button
              type="button"
              onClick={() => addListItem('cancellationPolicies')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1 rounded-full hover:bg-[#00E5FF]/20 transition"
            >
              <Plus className="h-3 w-3" />
              Add Policy Point
            </button>
          </div>
          <div className="space-y-2">
            {policies.map((policy, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={policy}
                  onChange={(e) => updateListItem('cancellationPolicies', index, e.target.value)}
                  placeholder={`Policy point ${index + 1} in ${language.toUpperCase()}`}
                  className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => removeListItem('cancellationPolicies', index)}
                  className="p-2 text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

