'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  MapPin,
  Check,
  Ban,
  HelpCircle,
  Info,
  ExternalLink,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import type { TourEditorData } from '@/types/tourEditor';

interface DestinationOption {
  id: string;
  name: string;
}

interface AiTourBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations?: DestinationOption[];
  onApplyDraft: (draft: Partial<TourEditorData>) => void;
}

type BuilderMode = 'prompt' | 'url' | 'text';

const SUGGESTED_PROMPTS = [
  'Desert Quad Biking Safari in Hurghada with Bedouin tea, camel ride and sunset photo stops.',
  'Full-day Snorkeling Boat Cruise to Giftun Island & Orange Bay with buffet lunch and water sports.',
  'Private Day Tour to Luxor from Hurghada: Valley of the Kings, Karnak Temple and Colossi of Memnon.',
  'Red Sea Dolphin House & Snorkeling Experience with guided reef swimming and hotel transfers.',
  'Cairo & Pyramids of Giza day excursion by flight with Egyptian Museum and private Egyptologist guide.',
];

const CATEGORIES = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'sea', label: 'Sea & Water' },
  { id: 'desert', label: 'Desert Safari' },
  { id: 'historical', label: 'Historical & Culture' },
  { id: 'city', label: 'City & Sightseeing' },
  { id: 'family', label: 'Family Friendly' },
];

export default function AiTourBuilderModal({
  isOpen,
  onClose,
  destinations = [],
  onApplyDraft,
}: AiTourBuilderModalProps) {
  const [mode, setMode] = useState<BuilderMode>('prompt');
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [category, setCategory] = useState('adventure');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<Partial<TourEditorData> | null>(null);
  const [reviewRequiredFields, setReviewRequiredFields] = useState<string[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedDestinationName =
    destinations.find((d) => d.id === destinationId)?.name || undefined;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setBlockedNotice(null);

    try {
      const payload: Record<string, any> = {
        mode,
        destinationName: selectedDestinationName,
        category,
      };

      if (mode === 'url') {
        if (!url.trim()) {
          setError('Please enter a tour URL to extract.');
          setIsLoading(false);
          return;
        }
        payload.url = url.trim();
        payload.prompt = prompt.trim();
      } else if (mode === 'text') {
        if (!sourceText.trim()) {
          setError('Please paste the tour source text or itinerary notes.');
          setIsLoading(false);
          return;
        }
        payload.sourceText = sourceText.trim();
        payload.prompt = prompt.trim();
      } else {
        if (!prompt.trim()) {
          setError('Please describe the tour you want to create.');
          setIsLoading(false);
          return;
        }
        payload.prompt = prompt.trim();
      }

      const res = await fetch('/api/admin/tours/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.blocked) {
          setBlockedNotice(
            data.suggestion ||
              'This website has anti-bot/Cloudflare protection. Please copy the tour text from your browser and paste it into the "Paste Tour Text" tab.'
          );
        }
        throw new Error(data.error || 'Failed to generate tour draft.');
      }

      if (data.tourData) {
        // Link destination if selected
        if (destinationId) {
          data.tourData.destinationId = destinationId;
        }
        setGeneratedDraft(data.tourData);
        setReviewRequiredFields(data.reviewRequiredFields || []);
        setAiExplanation(data.explanation || null);
      } else {
        throw new Error('AI returned an empty response. Please try again with more details.');
      }
    } catch (err: any) {
      console.error('AI Tour Generation error:', err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedDraft) return;
    onApplyDraft(generatedDraft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Positioning Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div
          className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl border border-cyan-500/30 bg-[#0B1528] p-5 sm:p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-[#00E5FF] border border-cyan-500/30 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">AI Tour Builder</h3>
                <span className="rounded-full bg-[#00E5FF]/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#00E5FF] border border-[#00E5FF]/20">
                  Universal AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate complete 27-section tours from a brief, an external link, or raw itinerary notes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            ✕
          </button>
        </div>

        {/* If Draft Generated: Show Review Screen */}
        {generatedDraft ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Tour Draft Successfully Generated!</h4>
                  <p className="text-xs text-slate-300">
                    Review the extracted structure below before applying it to the 8-step editor.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeneratedDraft(null);
                  setError(null);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate / Edit Prompt
              </button>
            </div>

            {/* AI Explanation */}
            {aiExplanation && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <p className="leading-relaxed">{aiExplanation}</p>
              </div>
            )}

            {/* Review Required Items Warning */}
            {reviewRequiredFields.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Items Requiring Administrator Input (Integrity Protection)
                    </h5>
                    <p className="text-xs text-slate-300 mt-1">
                      To prevent invented pricing or broken media links, please complete these in the editor:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-200/90 list-disc pl-4">
                      {reviewRequiredFields.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Grid */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5">
              {/* Title & Slug */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title & Category</span>
                <div className="flex items-center gap-3 mt-1">
                  <h4 className="text-base font-black text-white">{generatedDraft.translations?.en.title}</h4>
                  <span className="rounded-lg bg-[#00E5FF]/10 px-2 py-0.5 text-[11px] font-bold text-[#00E5FF] uppercase">
                    {generatedDraft.category}
                  </span>
                  <span className="text-xs text-slate-400">({generatedDraft.durationHours} hours)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  URL Slug: <span className="font-mono text-slate-300">/tours/{generatedDraft.slug}</span>
                </p>
              </div>

              {/* Excerpt */}
              {generatedDraft.translations?.en.cardExcerpt && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Card Excerpt</span>
                  <p className="text-xs text-slate-300 mt-0.5">{generatedDraft.translations.en.cardExcerpt}</p>
                </div>
              )}

              {/* Highlights */}
              {generatedDraft.highlights && generatedDraft.highlights.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highlights</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                    {generatedDraft.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-xs text-slate-300">
                        <Check className="h-3.5 w-3.5 text-[#00E5FF] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary */}
              {generatedDraft.itinerary && generatedDraft.itinerary.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Itinerary ({generatedDraft.itinerary.length} Milestones)
                  </span>
                  <div className="space-y-2 mt-1.5">
                    {generatedDraft.itinerary.map((m, i) => {
                      const mTitle = typeof m.title === 'string' ? m.title : m.title?.en || `Stop ${i + 1}`;
                      const mDesc = typeof m.description === 'string' ? m.description : m.description?.en || '';
                      return (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs">
                          <span className="font-mono font-bold text-[#00E5FF] shrink-0">{m.timeTag || (m as any).time || `Step ${i + 1}`}</span>
                          <div>
                            <p className="font-bold text-white">{mTitle}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{mDesc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generatedDraft.inclusions && generatedDraft.inclusions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Inclusions</span>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {generatedDraft.inclusions.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {generatedDraft.exclusions && generatedDraft.exclusions.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Exclusions</span>
                    <ul className="mt-1 space-y-1 text-xs text-slate-300">
                      {generatedDraft.exclusions.map((item, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Ban className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* FAQs */}
              {generatedDraft.faqItems && generatedDraft.faqItems.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    FAQs ({generatedDraft.faqItems.length} questions)
                  </span>
                  <div className="space-y-1.5 mt-1.5">
                    {generatedDraft.faqItems.slice(0, 3).map((faq, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-2 text-xs">
                        <p className="font-bold text-white">Q: {faq.question}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Apply Action Bar */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setGeneratedDraft(null)}
                className="text-xs font-bold text-slate-400 hover:text-white transition"
              >
                &larr; Discard & Try Again
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-blue-500 px-7 py-3 text-sm font-black text-[#070F1E] hover:brightness-110 transition shadow-lg shadow-[#00E5FF]/20"
              >
                <Sparkles className="h-4 w-4" />
                Apply to 8-Step Wizard (Step 1)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Input Configuration Screen */
          <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/40 p-1.5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('prompt');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  mode === 'prompt'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Prompt to Tour</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('url');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  mode === 'url'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>External Tour URL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('text');
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                  mode === 'text'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Paste Tour Text</span>
              </button>
            </div>

            {/* General Destination & Category Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Destination (Optional)
                </label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-[#00E5FF] focus:outline-none"
                >
                  <option value="">Auto-detect / Egypt General</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-[#00E5FF] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode 1: Prompt */}
            {mode === 'prompt' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Tour Idea or Description
                  </label>
                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your tour in plain English (e.g. 'Create a luxury catamaran snorkeling trip in Hurghada with seafood lunch, hotel transfers, and swimming with dolphins at Shaab El Erg...')"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Quick Prompts */}
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                    Quick Inspiration:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt(p)}
                        className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-1.5 text-left text-[11px] text-slate-300 hover:border-[#00E5FF]/40 hover:bg-white/[0.06] hover:text-white transition"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: External Tour URL */}
            {mode === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    External Tour Link
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.viator.com/tours/Hurghada/... or GetYourGuide URL"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none font-mono"
                    />
                    <Globe className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 'Make it a VIP private experience with upgraded seafood lunch'"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400 leading-relaxed space-y-1">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-[#00E5FF]" />
                    Originality & Integrity Assurance
                  </p>
                  <p>
                    Talago AI extracts factual itineraries, stops, and logistics, then writes 100% original, professional marketing copy.
                    External images and pricing are not copied.
                  </p>
                </div>
              </div>
            )}

            {/* Mode 3: Paste Text */}
            {mode === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Raw Tour Notes, Operator Itinerary or Copied Description
                  </label>
                  <textarea
                    rows={6}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste the raw text of the tour here. It can be bullet points, an operator sheet, or copied text from a brochure or website..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Additional Brief / Tone Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 'Emphasize marine conservation and small group comfort'"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Error or Blocked Notice */}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-200">{error}</p>
                  {blockedNotice && (
                    <div className="mt-2 text-slate-300">
                      <p>{blockedNotice}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('text');
                          setError(null);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-white/20 transition"
                      >
                        Switch to Paste Text Mode &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleGenerate}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-blue-500 px-7 py-3 text-sm font-black text-[#070F1E] hover:brightness-110 transition shadow-lg shadow-[#00E5FF]/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#070F1E]" />
                    <span>AI Synthesizing 27 Tour Sections...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Complete Tour Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
