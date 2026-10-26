'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bot, Eye, EyeOff, Languages, Loader2, Plus, Save, Trash2,
  Copy, Sparkles, HelpCircle, Check, RefreshCw, Undo2, ChevronDown,
  FileText, AlertCircle, ArrowUpRight,
} from 'lucide-react';
import { LANGUAGES, LANGUAGE_LABELS, type LanguageCode } from '@/lib/i18n';
import Link from 'next/link';

type Block = { id: string; heading: string; body: string; visible: boolean; kind: 'TEXT' | 'FAQ' };
type Locale = { title: string; intro: string; blocks: Block[] };
type Page = { slug: string; label: string; visible: boolean; translations: Partial<Record<LanguageCode, Locale>> };

const emptyLocale = (): Locale => ({ title: '', intro: '', blocks: [] });

export default function ContentPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('about');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [brief, setBrief] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [activeBlockAi, setActiveBlockAi] = useState<{ index: number; mode: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const selected = pages.find((page) => page.slug === selectedSlug);

  // Check if current language has an explicit translation
  const hasTranslation = Boolean(selected?.translations[language]);
  const englishLocale = useMemo(() => selected?.translations.en || emptyLocale(), [selected]);
  const locale = useMemo(() => selected?.translations[language] || emptyLocale(), [selected, language]);

  useEffect(() => {
    fetch('/api/admin/content-pages')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load content pages');
        return res.json();
      })
      .then((payload) => setPages(payload.pages || []))
      .catch((err) => setMessage({ type: 'error', text: err.message || 'Unable to load content pages.' }));
  }, []);

  const replace = (next: Page) => {
    setPages((current) => current.map((page) => (page.slug === next.slug ? next : page)));
  };

  const replaceLocale = (next: Locale) => {
    if (!selected) return;
    replace({
      ...selected,
      translations: {
        ...selected.translations,
        [language]: next,
      },
    });
  };

  const makeBlocks = (blocks: Array<Omit<Block, 'id' | 'visible'>>) =>
    blocks.map((block, index) => ({
      ...block,
      id: `${selected?.slug || 'page'}-${language}-${Date.now()}-${index}`,
      visible: true,
    }));

  // Save all pages to server
  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/content-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to save');
      setPages(payload.pages);
      setMessage({ type: 'success', text: 'All content pages saved successfully. Public website updated.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save content.' });
    } finally {
      setSaving(false);
    }
  };

  // AI draft generator from brief
  const runAiGenerate = async () => {
    if (!selected || !brief.trim()) {
      setMessage({ type: 'error', text: 'Please write a brief or topic prompt first.' });
      return;
    }
    setAiBusy('generate');
    setMessage(null);
    try {
      const response = await fetch('/api/admin/content-pages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', brief, pageLabel: selected.label }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      replaceLocale({ ...payload.page, blocks: makeBlocks(payload.page.blocks || []) });
      setMessage({ type: 'success', text: 'English draft generated. Review the sections and click "Save changes".' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI generation failed.' });
    } finally {
      setAiBusy(null);
    }
  };

  // AI FAQ generator
  const runAiFaqs = async () => {
    if (!selected || !englishLocale.title) {
      setMessage({ type: 'error', text: 'Page title is required before generating FAQs.' });
      return;
    }
    setAiBusy('faqs');
    setMessage(null);
    try {
      const response = await fetch('/api/admin/content-pages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-faqs', title: englishLocale.title, intro: englishLocale.intro }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const newFaqBlocks = makeBlocks(payload.blocks || []);
      const currentBlocks = (hasTranslation ? locale.blocks : englishLocale.blocks) || [];
      replaceLocale({
        title: hasTranslation ? locale.title : englishLocale.title,
        intro: hasTranslation ? locale.intro : englishLocale.intro,
        blocks: [...currentBlocks, ...newFaqBlocks],
      });
      setMessage({ type: 'success', text: `Added ${newFaqBlocks.length} AI FAQ items. Review and save.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI FAQ generation failed.' });
    } finally {
      setAiBusy(null);
    }
  };

  // AI translate single active language
  const runAiTranslateSingle = async (targetLang: LanguageCode) => {
    if (!selected || !englishLocale.title) {
      setMessage({ type: 'error', text: 'English content is required as the source for translation.' });
      return;
    }
    setAiBusy(`translate-${targetLang}`);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/content-pages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate-single', source: englishLocale, targetLang }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      replace({
        ...selected,
        translations: {
          ...selected.translations,
          [targetLang]: { ...payload.page, blocks: makeBlocks(payload.page.blocks || []) },
        },
      });
      setMessage({ type: 'success', text: `Draft in ${LANGUAGE_LABELS[targetLang]} generated. Review and click "Save changes".` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Translation failed.' });
    } finally {
      setAiBusy(null);
    }
  };

  // AI translate all languages
  const runAiTranslateAll = async () => {
    if (!selected || !englishLocale.title) {
      setMessage({ type: 'error', text: 'English content is required as the source for translation.' });
      return;
    }
    setAiBusy('translate-all');
    setMessage(null);
    try {
      const response = await fetch('/api/admin/content-pages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate-all', source: englishLocale }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);

      const translations: Page['translations'] = { ...selected.translations };
      Object.entries(payload.translations || {}).forEach(([key, value]) => {
        const item = value as Omit<Locale, 'blocks'> & { blocks?: Array<Omit<Block, 'id' | 'visible'>> };
        translations[key as LanguageCode] = { ...item, blocks: makeBlocks(item.blocks || []) };
      });
      replace({ ...selected, translations });
      setMessage({ type: 'success', text: 'All language drafts generated. Review each tab and click "Save changes".' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Translation failed.' });
    } finally {
      setAiBusy(null);
    }
  };

  // Copy English content to active language
  const copyEnglishToActive = () => {
    if (!selected) return;
    replaceLocale({
      title: englishLocale.title,
      intro: englishLocale.intro,
      blocks: makeBlocks(englishLocale.blocks),
    });
    setMessage({ type: 'info', text: `Copied English content into ${LANGUAGE_LABELS[language]}. You can now translate it.` });
  };

  // AI block rewrite/shorten/expand
  const runAiBlockRewrite = async (index: number, mode: 'rewrite' | 'shorten' | 'expand') => {
    const currentBlocks = hasTranslation ? locale.blocks : englishLocale.blocks;
    const block = currentBlocks[index];
    if (!block || !block.body.trim()) return;

    setActiveBlockAi({ index, mode });
    try {
      const response = await fetch('/api/admin/content-pages/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rewrite-block', text: block.body, mode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);

      const nextBlocks = [...currentBlocks];
      nextBlocks[index] = { ...block, body: payload.text };
      replaceLocale({
        title: hasTranslation ? locale.title : englishLocale.title,
        intro: hasTranslation ? locale.intro : englishLocale.intro,
        blocks: nextBlocks,
      });
      setMessage({ type: 'success', text: `Section body ${mode === 'shorten' ? 'shortened' : mode === 'expand' ? 'expanded' : 'rewritten'}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'AI rewrite failed.' });
    } finally {
      setActiveBlockAi(null);
    }
  };

  if (!selected) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070F1E] p-8 text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
      </main>
    );
  }

  const activeContent = hasTranslation ? locale : englishLocale;

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00E5FF]">
            Marketplace Copywriting
          </p>
          <h1 className="mt-1 text-3xl font-black text-white">Content Studio</h1>
          <p className="mt-2 text-sm text-slate-400">
            Edit and publish customer-facing informational pages in all supported languages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${selected.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <span>Preview Page</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:bg-[#00E5FF]/90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {message && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : message.type === 'error'
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
              : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar + Editor */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Page List Sidebar */}
        <aside className="space-y-1.5 rounded-2xl border border-white/10 bg-[#0B1528] p-3 shadow-xl">
          <p className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
            Pages ({pages.length})
          </p>
          {pages.map((page) => {
            const isSelected = page.slug === selected.slug;
            const langCount = Object.keys(page.translations).length;
            return (
              <button
                key={page.slug}
                type="button"
                onClick={() => setSelectedSlug(page.slug)}
                className={`w-full rounded-xl px-3.5 py-3 text-left transition ${
                  isSelected
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{page.label}</span>
                  <span className={`text-[10px] rounded px-1.5 py-0.5 font-mono ${
                    isSelected ? 'bg-black/10 text-[#070F1E]' : 'bg-white/5 text-slate-400'
                  }`}>
                    {langCount}/8
                  </span>
                </div>
                <div className={`mt-0.5 text-[10px] ${isSelected ? 'text-[#070F1E]/80' : 'text-slate-500'}`}>
                  /{page.slug}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Editor Main Section */}
        <section className="min-w-0 space-y-6 rounded-2xl border border-white/10 bg-[#0B1528] p-5 sm:p-7 shadow-xl">
          {/* Page Title & Visibility Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">{selected.label}</h2>
              <span className="font-mono text-xs text-slate-500">Slug: /{selected.slug}</span>
            </div>
            <button
              type="button"
              onClick={() => replace({ ...selected, visible: !selected.visible })}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                selected.visible
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {selected.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {selected.visible ? 'Published' : 'Draft / Hidden'}
            </button>
          </div>

          {/* Language Tabs */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Content Language</span>
              <span className="text-[11px] text-slate-500">
                {hasTranslation ? '✓ Custom translation active' : language === 'en' ? 'Primary language' : '— Using English fallback'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((code) => {
                const isCurrent = code === language;
                const isTrans = Boolean(selected.translations[code]);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                        : isTrans
                        ? 'border border-white/10 bg-white/[0.04] text-slate-200 hover:border-[#00E5FF]/40'
                        : 'border border-white/5 text-slate-500 hover:border-white/15 hover:text-slate-400'
                    }`}
                  >
                    <span>{LANGUAGE_LABELS[code]}</span>
                    {code === 'en' ? (
                      <span className="text-[10px] opacity-60 font-mono">EN</span>
                    ) : isTrans ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Translated" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Untranslated Language Helper Banner */}
          {language !== 'en' && !hasTranslation && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-amber-200">
                    No custom translation for {LANGUAGE_LABELS[language]} yet.
                  </p>
                  <p className="mt-1 text-slate-400 leading-5">
                    Visitors browsing in {LANGUAGE_LABELS[language]} currently see the English version. You can copy the English content to translate manually or generate an AI translation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={copyEnglishToActive}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-bold text-white hover:bg-white/10 transition"
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    Copy English
                  </button>
                  <button
                    type="button"
                    disabled={aiBusy !== null}
                    onClick={() => void runAiTranslateSingle(language)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 font-black text-[#070F1E] hover:bg-amber-300 transition disabled:opacity-50"
                  >
                    {aiBusy === `translate-${language}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Languages className="h-3.5 w-3.5" />
                    )}
                    Translate with AI
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* English AI Assistance Tools */}
          {language === 'en' && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.03] p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                <Sparkles className="h-4 w-4" />
                <span>AI Content Studio Tools</span>
              </div>
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                rows={2}
                placeholder="Brief / prompt: Describe the purpose of this page, tone, or key facts to generate a full draft..."
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400/50"
              />
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={aiBusy !== null}
                  onClick={() => void runAiGenerate()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-black text-[#070F1E] hover:bg-emerald-300 transition disabled:opacity-50"
                >
                  {aiBusy === 'generate' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                  Generate Full Draft
                </button>
                <button
                  type="button"
                  disabled={aiBusy !== null || !englishLocale.title}
                  onClick={() => void runAiFaqs()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50"
                >
                  {aiBusy === 'faqs' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <HelpCircle className="h-3.5 w-3.5" />
                  )}
                  Draft FAQs with AI
                </button>
                <button
                  type="button"
                  disabled={aiBusy !== null || !englishLocale.title}
                  onClick={() => void runAiTranslateAll()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition disabled:opacity-50"
                >
                  {aiBusy === 'translate-all' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Languages className="h-3.5 w-3.5 text-[#00E5FF]" />
                  )}
                  Translate All 7 Languages
                </button>
              </div>
            </div>
          )}

          {/* Page Title & Intro Inputs */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Page Headline ({language.toUpperCase()})
              </label>
              <input
                value={activeContent.title}
                onChange={(event) =>
                  replaceLocale({
                    ...activeContent,
                    title: event.target.value,
                  })
                }
                placeholder="e.g. A marketplace for better travel days"
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-base font-bold text-white outline-none focus:border-[#00E5FF]/40 transition"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Introduction / Hero Paragraph ({language.toUpperCase()})
              </label>
              <textarea
                value={activeContent.intro}
                onChange={(event) =>
                  replaceLocale({
                    ...activeContent,
                    intro: event.target.value,
                  })
                }
                rows={3}
                placeholder="Concise overview summarizing this page for travelers..."
                className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-xs leading-6 text-white outline-none focus:border-[#00E5FF]/40 transition"
              />
            </div>
          </div>

          {/* Blocks Section Header */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Page Sections & FAQ Items ({activeContent.blocks.length})
              </h3>
              <p className="text-xs text-slate-500">
                Organize paragraphs, policies, or questions shown on this page.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                replaceLocale({
                  ...activeContent,
                  blocks: [
                    ...activeContent.blocks,
                    {
                      id: `${selected.slug}-${language}-${Date.now()}`,
                      heading: '',
                      body: '',
                      visible: true,
                      kind: 'TEXT',
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[#00E5FF]/40 bg-[#00E5FF]/10 px-3.5 py-2 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>

          {/* Block List */}
          <div className="space-y-4">
            {activeContent.blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">
                No sections added yet. Click &quot;Add Section&quot; or use AI to draft content.
              </div>
            ) : (
              activeContent.blocks.map((block, index) => {
                const isBlockBusy = activeBlockAi?.index === index;
                return (
                  <div
                    key={block.id}
                    className="rounded-2xl border border-white/10 bg-[#070F1E] p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    {/* Block Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <select
                          value={block.kind}
                          onChange={(event) => {
                            const blocks = [...activeContent.blocks];
                            blocks[index] = { ...block, kind: event.target.value as Block['kind'] };
                            replaceLocale({ ...activeContent, blocks });
                          }}
                          className="rounded-lg border border-white/10 bg-[#0B1528] px-2.5 py-1 text-xs font-semibold text-white outline-none"
                        >
                          <option value="TEXT">Article Section</option>
                          <option value="FAQ">FAQ Question & Answer</option>
                        </select>
                      </div>

                      {/* Per-block AI helper actions */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                          AI:
                        </span>
                        <button
                          type="button"
                          disabled={isBlockBusy || !block.body.trim()}
                          onClick={() => void runAiBlockRewrite(index, 'rewrite')}
                          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-cyan-400/30 transition disabled:opacity-40"
                          title="Polish and improve clarity"
                        >
                          {isBlockBusy && activeBlockAi?.mode === 'rewrite' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Polish'
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isBlockBusy || !block.body.trim()}
                          onClick={() => void runAiBlockRewrite(index, 'shorten')}
                          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-cyan-400/30 transition disabled:opacity-40"
                          title="Make text more concise"
                        >
                          {isBlockBusy && activeBlockAi?.mode === 'shorten' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Shorten'
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isBlockBusy || !block.body.trim()}
                          onClick={() => void runAiBlockRewrite(index, 'expand')}
                          className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-cyan-400/30 transition disabled:opacity-40"
                          title="Expand with helpful details"
                        >
                          {isBlockBusy && activeBlockAi?.mode === 'expand' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Expand'
                          )}
                        </button>

                        <div className="h-4 w-px bg-white/10 mx-1" />

                        {/* Visibility & Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            const blocks = [...activeContent.blocks];
                            blocks[index] = { ...block, visible: !block.visible };
                            replaceLocale({ ...activeContent, blocks });
                          }}
                          className={`p-1 text-slate-400 hover:text-white ${
                            !block.visible ? 'opacity-40' : ''
                          }`}
                          title={block.visible ? 'Visible' : 'Hidden'}
                        >
                          {block.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            replaceLocale({
                              ...activeContent,
                              blocks: activeContent.blocks.filter((_, i) => i !== index),
                            })
                          }
                          className="p-1 text-rose-400 hover:text-rose-300"
                          title="Delete section"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block Input Fields */}
                    <div>
                      <input
                        value={block.heading}
                        onChange={(event) => {
                          const blocks = [...activeContent.blocks];
                          blocks[index] = { ...block, heading: event.target.value };
                          replaceLocale({ ...activeContent, blocks });
                        }}
                        placeholder={block.kind === 'FAQ' ? 'Question title (e.g. When do I choose a pickup area?)' : 'Section heading (e.g. How experiences are selected)'}
                        className="w-full border-b border-white/10 bg-transparent pb-2 text-sm font-bold text-white outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                    <div>
                      <textarea
                        value={block.body}
                        onChange={(event) => {
                          const blocks = [...activeContent.blocks];
                          blocks[index] = { ...block, body: event.target.value };
                          replaceLocale({ ...activeContent, blocks });
                        }}
                        placeholder={block.kind === 'FAQ' ? 'Provide a clear, helpful answer for travellers...' : 'Write the section paragraph or policy details...'}
                        rows={3}
                        className="w-full resize-y bg-transparent text-xs leading-6 text-slate-300 outline-none"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-between border-t border-white/10 pt-5">
            <span className="text-xs text-slate-500">
              Editing: <span className="text-white font-bold">{selected.label}</span> ({LANGUAGE_LABELS[language]})
            </span>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:bg-[#00E5FF]/90 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
