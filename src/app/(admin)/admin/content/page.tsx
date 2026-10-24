'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, Eye, EyeOff, Languages, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { LANGUAGES, LANGUAGE_LABELS, type LanguageCode } from '@/lib/i18n';

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
  const [aiBusy, setAiBusy] = useState<'generate' | 'translate' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = pages.find((page) => page.slug === selectedSlug);
  const locale = useMemo(() => selected?.translations[language] || selected?.translations.en || emptyLocale(), [language, selected]);

  useEffect(() => { fetch('/api/admin/content-pages').then((response) => response.json()).then((payload) => setPages(payload.pages || [])).catch(() => setMessage('Unable to load content pages.')); }, []);
  const replace = (next: Page) => setPages((current) => current.map((page) => page.slug === next.slug ? next : page));
  const replaceLocale = (next: Locale) => selected && replace({ ...selected, translations: { ...selected.translations, [language]: next } });
  const makeBlocks = (blocks: Array<Omit<Block, 'id' | 'visible'>>) => blocks.map((block, index) => ({ ...block, id: `${selected?.slug || 'page'}-${language}-${Date.now()}-${index}`, visible: true }));

  const save = async () => { setSaving(true); setMessage(null); try { const response = await fetch('/api/admin/content-pages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pages }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setPages(payload.pages); setMessage('Content saved.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save content.'); } finally { setSaving(false); } };
  const runAi = async (action: 'generate' | 'translate') => {
    if (!selected || (action === 'generate' && !brief.trim())) { setMessage('Write an example or brief first.'); return; }
    setAiBusy(action); setMessage(null);
    try {
      const response = await fetch('/api/admin/content-pages/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'generate' ? { action, brief, pageLabel: selected.label } : { action, source: selected.translations.en || locale }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
      if (action === 'generate') replaceLocale({ ...payload.page, blocks: makeBlocks(payload.page.blocks || []) });
      else { const translations: Page['translations'] = { ...selected.translations }; Object.entries(payload.translations || {}).forEach(([key, value]) => { const item = value as Omit<Locale, 'blocks'> & { blocks?: Array<Omit<Block, 'id' | 'visible'>> }; translations[key as LanguageCode] = { ...item, blocks: makeBlocks(item.blocks || []) }; }); replace({ ...selected, translations }); }
      setMessage(action === 'generate' ? 'Draft generated. Review it, then save.' : 'All language drafts generated. Review them, then save.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'AI request failed.'); } finally { setAiBusy(null); }
  };

  if (!selected) return <main className="p-8 text-slate-300">Loading content studio...</main>;
  return <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-10"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Marketplace content</p><h1 className="mt-1 text-3xl font-black text-white">Content Studio</h1><p className="mt-2 text-sm text-slate-400">Edit every public page in every supported language.</p></div><button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving' : 'Save changes'}</button></div>
    {message && <p className="mb-5 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</p>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_1fr]"><aside className="space-y-1 rounded-lg border border-white/10 bg-[#0B1528] p-2">{pages.map((page) => <button key={page.slug} type="button" onClick={() => setSelectedSlug(page.slug)} className={`w-full rounded-md px-3 py-2.5 text-left text-sm font-semibold ${page.slug === selected.slug ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-white/[0.05]'}`}>{page.label}</button>)}</aside>
      <section className="min-w-0 space-y-6 rounded-lg border border-white/10 bg-[#0B1528] p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="min-w-0 text-lg font-bold text-white">{selected.label}</h2><button type="button" onClick={() => replace({ ...selected, visible: !selected.visible })} className="inline-flex shrink-0 items-center gap-2 text-sm text-slate-300">{selected.visible ? <Eye className="h-4 w-4 text-cyan-300" /> : <EyeOff className="h-4 w-4 text-slate-500" />}{selected.visible ? 'Visible' : 'Hidden'}</button></div>
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">{LANGUAGES.map((code) => <button key={code} type="button" onClick={() => setLanguage(code)} className={`rounded-md px-3 py-2 text-xs font-bold ${code === language ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 text-slate-300 hover:border-cyan-300/40'}`}>{LANGUAGE_LABELS[code]}</button>)}</div>
        {language === 'en' && <div className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] p-4"><label className="mb-2 block text-sm font-bold text-emerald-100">AI draft from an example or brief</label><textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={3} placeholder="Example: Write a friendly marketplace About page explaining that TALAGO compares vetted operators in Egypt..." className="w-full rounded-md border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={aiBusy !== null} onClick={() => void runAi('generate')} className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{aiBusy === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}Generate English draft</button><button type="button" disabled={aiBusy !== null || !selected.translations.en?.title} onClick={() => void runAi('translate')} className="inline-flex items-center gap-2 rounded-md border border-emerald-300/40 px-3 py-2 text-sm font-bold text-emerald-100 disabled:opacity-50">{aiBusy === 'translate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}Translate all languages</button></div></div>}
        <input value={locale.title} onChange={(event) => replaceLocale({ ...locale, title: event.target.value })} placeholder="Page title" className="w-full rounded-md border border-white/10 bg-[#070F1E] px-3 py-3 text-lg font-bold text-white outline-none" />
        <textarea value={locale.intro} onChange={(event) => replaceLocale({ ...locale, intro: event.target.value })} rows={3} placeholder="Intro" className="w-full rounded-md border border-white/10 bg-[#070F1E] px-3 py-3 text-sm text-white outline-none" />
        <div className="space-y-4">{locale.blocks.map((block, index) => <div key={block.id} className="rounded-md border border-white/10 bg-[#070F1E] p-4"><div className="mb-3 flex items-center justify-between gap-3"><select value={block.kind} onChange={(event) => { const blocks = [...locale.blocks]; blocks[index] = { ...block, kind: event.target.value as Block['kind'] }; replaceLocale({ ...locale, blocks }); }} className="rounded border border-white/10 bg-[#0B1528] px-2 py-1 text-xs text-white"><option value="TEXT">Text section</option><option value="FAQ">FAQ item</option></select><div className="flex gap-3"><button type="button" onClick={() => { const blocks = [...locale.blocks]; blocks[index] = { ...block, visible: !block.visible }; replaceLocale({ ...locale, blocks }); }} className="text-slate-400">{block.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button><button type="button" onClick={() => replaceLocale({ ...locale, blocks: locale.blocks.filter((_, itemIndex) => itemIndex !== index) })} className="text-rose-300"><Trash2 className="h-4 w-4" /></button></div></div><input value={block.heading} onChange={(event) => { const blocks = [...locale.blocks]; blocks[index] = { ...block, heading: event.target.value }; replaceLocale({ ...locale, blocks }); }} placeholder={block.kind === 'FAQ' ? 'Question' : 'Heading'} className="mb-2 w-full border-b border-white/10 bg-transparent pb-2 text-sm font-bold text-white outline-none" /><textarea value={block.body} onChange={(event) => { const blocks = [...locale.blocks]; blocks[index] = { ...block, body: event.target.value }; replaceLocale({ ...locale, blocks }); }} placeholder={block.kind === 'FAQ' ? 'Answer' : 'Body'} rows={3} className="w-full resize-y bg-transparent text-sm leading-6 text-slate-300 outline-none" /></div>)}</div>
        <button type="button" onClick={() => replaceLocale({ ...locale, blocks: [...locale.blocks, { id: `${selected.slug}-${language}-${Date.now()}`, heading: '', body: '', visible: true, kind: 'TEXT' }] })} className="inline-flex items-center gap-2 rounded-md border border-dashed border-cyan-300/40 px-3 py-2 text-sm font-bold text-cyan-200"><Plus className="h-4 w-4" />Add section</button>
      </section></div>
  </main>;
}
