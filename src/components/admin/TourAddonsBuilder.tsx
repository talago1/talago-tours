'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import type { TourAddon, LanguageCode } from '@/types/tourBuilder';
import { createDefaultAddon, LANGUAGE_CODES, LANGUAGE_LABELS } from '@/types/tourBuilder';

interface TourAddonsBuilderProps {
  addons: TourAddon[];
  activeLanguage?: LanguageCode;
  onChange: (addons: TourAddon[]) => void;
}

const LANG_FLAGS: Record<LanguageCode, string> = {
  en: '🇬🇧', de: '🇩🇪', ru: '🇷🇺', fr: '🇫🇷', it: '🇮🇹', pl: '🇵🇱', es: '🇪🇸',
};

export default function TourAddonsBuilder({ addons, activeLanguage = 'en', onChange }: TourAddonsBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<LanguageCode>(activeLanguage);

  useEffect(() => {
    setActiveLang(activeLanguage);
  }, [activeLanguage]);

  const addNew = () => {
    const addon = createDefaultAddon();
    onChange([...addons, addon]);
    setExpandedId(addon.id);
  };

  const remove = (id: string) => {
    onChange(addons.filter((a) => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const update = (id: string, partial: Partial<TourAddon>) => {
    onChange(addons.map((a) => (a.id === id ? { ...a, ...partial } : a)));
  };

  const updateLabel = (id: string, lang: LanguageCode, value: string) => {
    const addon = addons.find((a) => a.id === id);
    if (!addon) return;
    update(id, { labels: { ...addon.labels, [lang]: value } });
  };

  const updateDesc = (id: string, lang: LanguageCode, value: string) => {
    const addon = addons.find((a) => a.id === id);
    if (!addon) return;
    update(id, { descriptions: { ...addon.descriptions, [lang]: value } });
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Tour Options & Add-ons</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Optional upgrades customers can select at checkout. Set multilingual names, price, and type.
          </p>
        </div>
        <button
          type="button"
          onClick={addNew}
          className="inline-flex items-center gap-2 rounded-full bg-[#EAB308]/10 border border-[#EAB308]/30 px-4 py-2 text-sm font-bold text-[#EAB308] transition hover:bg-[#EAB308]/20"
        >
          <Plus className="h-4 w-4" />
          Add Option
        </button>
      </div>

      {addons.length > 0 && (
        <div className="mb-4 flex gap-1.5 flex-wrap">
          {LANGUAGE_CODES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                activeLang === lang
                  ? 'bg-[#06B6D4] text-[#070F1E]'
                  : 'border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {LANG_FLAGS[lang]} {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {addons.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-slate-500">No options added yet. Click &quot;Add Option&quot; to create your first upgrade.</p>
          </div>
        )}

        {addons.map((addon, index) => {
          const isExpanded = expandedId === addon.id;
          const label = addon.labels[activeLang] || addon.labels.en || `Option ${index + 1}`;

          return (
            <div
              key={addon.id}
              className={`rounded-2xl border transition-all ${
                addon.enabled
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-white/5 bg-white/[0.01] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => update(addon.id, { enabled: !addon.enabled })}
                  className="shrink-0 text-slate-400 hover:text-white transition"
                >
                  {addon.enabled
                    ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                    : <ToggleLeft className="h-5 w-5 text-slate-600" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ${addon.price} {addon.priceType === 'per_person' ? '/ person' : 'flat total'}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-black text-slate-500">
                  #{index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => remove(addon.id)}
                  className="shrink-0 rounded-xl p-2 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : addon.id)}
                  className="shrink-0 rounded-xl p-2 text-slate-400 hover:text-white transition"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-widest">Price (USD)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={addon.price}
                        onChange={(e) => update(addon.id, { price: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-2.5 text-sm text-white outline-none focus:border-[#06B6D4]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-widest">Price Type</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => update(addon.id, { priceType: 'per_person' })}
                          className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition ${
                            addon.priceType === 'per_person'
                              ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]'
                              : 'border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Per Person
                        </button>
                        <button
                          type="button"
                          onClick={() => update(addon.id, { priceType: 'flat' })}
                          className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition ${
                            addon.priceType === 'flat'
                              ? 'border-[#EAB308] bg-[#EAB308]/10 text-[#EAB308]'
                              : 'border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          Flat Total
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Option Name — All Languages</p>
                    {LANGUAGE_CODES.map((lang) => (
                      <div key={lang} className="grid grid-cols-[32px_1fr_1fr] gap-2 items-center">
                        <span className="text-sm">{LANG_FLAGS[lang]}</span>
                        <input
                          type="text"
                          value={addon.labels[lang] || ''}
                          onChange={(e) => updateLabel(addon.id, lang, e.target.value)}
                          placeholder={`Name in ${lang.toUpperCase()}`}
                          className="rounded-lg border border-white/5 bg-[#070F1E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#06B6D4] placeholder:text-slate-700"
                        />
                        <input
                          type="text"
                          value={addon.descriptions[lang] || ''}
                          onChange={(e) => updateDesc(addon.id, lang, e.target.value)}
                          placeholder={`Short description in ${lang.toUpperCase()}`}
                          className="rounded-lg border border-white/5 bg-[#070F1E] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#06B6D4] placeholder:text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
