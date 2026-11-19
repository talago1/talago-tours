'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
} from 'lucide-react';
import type { HomepageCollectionConfig, HomepageSectionConfig } from '@/types/homepage';
import { DEFAULT_HOMEPAGE_COLLECTIONS, DEFAULT_HOMEPAGE_SECTIONS } from '@/types/homepage';

export default function HomepageCollectionsDashboard() {
  const [activeTab, setActiveTab] = useState<'carousels' | 'sections'>('sections');
  const [collections, setCollections] = useState<HomepageCollectionConfig[]>([]);
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New collection modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newType, setNewType] = useState<'featured' | 'destination' | 'category' | 'popular'>('destination');
  const [newTargetSlug, setNewTargetSlug] = useState('');
  const [newMaxItems, setNewMaxItems] = useState(8);
  const [newViewAllLink, setNewViewAllLink] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/homepage-collections');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.collections)) setCollections(data.collections);
        else setCollections(DEFAULT_HOMEPAGE_COLLECTIONS);

        if (Array.isArray(data.sections) && data.sections.length > 0) setSections(data.sections);
        else setSections(DEFAULT_HOMEPAGE_SECTIONS);
      } else {
        setCollections(DEFAULT_HOMEPAGE_COLLECTIONS);
        setSections(DEFAULT_HOMEPAGE_SECTIONS);
      }
    } catch {
      setCollections(DEFAULT_HOMEPAGE_COLLECTIONS);
      setSections(DEFAULT_HOMEPAGE_SECTIONS);
    } finally {
      setLoading(false);
    }
  }

  // --- Sections handlers ---
  async function handleToggleSection(key: string) {
    const updated = sections.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s));
    setSections(updated);
    await persistSections(updated);
  }

  async function handleMoveSection(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const copy = [...sections];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);

    const reordered = copy.map((s, i) => ({ ...s, order: i }));
    setSections(reordered);
    await persistSections(reordered);
  }

  async function handleResetSectionsDefault() {
    if (!confirm('Reset homepage sections to the recommended default layout (Hero → Destinations → Interests → Carousels → Why TALAGO)?')) return;
    setSections(DEFAULT_HOMEPAGE_SECTIONS);
    await persistSections(DEFAULT_HOMEPAGE_SECTIONS);
  }

  async function persistSections(nextList: HomepageSectionConfig[]) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/homepage-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: nextList }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save homepage section order.');
      }
    } catch (e: any) {
      setError(e.message || 'Error saving sections.');
    } finally {
      setSaving(false);
    }
  }

  // --- Collections handlers ---
  async function handleToggleEnabled(id: string) {
    const updated = collections.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setCollections(updated);
    await persistCollections(updated);
  }

  async function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= collections.length) return;

    const copy = [...collections];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);

    const reordered = copy.map((c, i) => ({ ...c, order: i }));
    setCollections(reordered);
    await persistCollections(reordered);
  }

  async function persistCollections(nextList: HomepageCollectionConfig[]) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/homepage-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: nextList }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save collections.');
      }
    } catch (e: any) {
      setError(e.message || 'Error saving collections.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = `custom-${newType}-${newTargetSlug || Date.now()}`;
    const newItem: HomepageCollectionConfig = {
      id: newId,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      type: newType,
      targetSlug: newTargetSlug.trim() || undefined,
      enabled: true,
      maxItems: newMaxItems,
      viewAllLink: newViewAllLink.trim() || undefined,
      order: collections.length,
    };

    const nextList = [...collections, newItem];
    setCollections(nextList);
    setShowAddModal(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewTargetSlug('');
    setNewViewAllLink('');
    await persistCollections(nextList);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this discovery section from homepage?')) return;
    const nextList = collections.filter((c) => c.id !== id);
    setCollections(nextList);
    await persistCollections(nextList);
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-[#0B1528]/80 p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Homepage Discovery Collections</h2>
              <p className="text-xs text-slate-400">
                Manage horizontal experience carousels inspired by GetYourGuide (Top Experiences, Destination carousels, Themed collections).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === 'carousels' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] px-4 py-2 text-xs font-bold text-black transition-all hover:opacity-90 shadow-lg shadow-[#00E5FF]/20"
            >
              <Plus className="h-4 w-4" />
              Add Carousel
            </button>
          )}
          {activeTab === 'sections' && (
            <button
              onClick={() => handleResetSectionsDefault()}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:border-[#FFD700]/40 hover:text-[#FFD700]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset to Default Order
            </button>
          )}
        </div>
      </div>

      {/* Sub-tabs selector */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'sections'
              ? 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Homepage Section Flow &amp; Order
        </button>
        <button
          onClick={() => setActiveTab('carousels')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'carousels'
              ? 'bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Experience Carousels &amp; Collections ({collections.length})
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Homepage configuration updated and saved successfully.</span>
        </div>
      )}

      {/* Tab 1: Section Order & Flow */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-300">
            <p className="font-semibold text-white mb-1">Recommended Default Discovery Order:</p>
            <p className="text-slate-400 leading-relaxed">
              1. Hero &amp; Unified Search → 2. Explore Destinations (Top 5) → 3. Explore by Interest → 4. Experience Collections &amp; Carousels → 5. Why TALAGO (Trust Grid) → 6. Reviews → 7. FAQ.
              You can reorder sections using the arrows or toggle visibility anytime.
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <div
                key={sec.key}
                className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all ${
                  sec.enabled
                    ? 'border-white/10 bg-[#0B1528]/80 hover:border-white/20'
                    : 'border-white/5 bg-white/[0.01] opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{sec.label}</h3>
                        <span className="font-mono text-[10px] text-slate-500">[{sec.key}]</span>
                        {sec.key === 'destinations' && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                            Approved 5 Destinations
                          </span>
                        )}
                        {sec.key === 'interests' && (
                          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                            Category Row
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{sec.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleToggleSection(sec.key)}
                      disabled={saving}
                      title={sec.enabled ? 'Hide Section' : 'Show Section'}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                        sec.enabled
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      <span>{sec.enabled ? 'Visible' : 'Hidden'}</span>
                    </button>

                    <button
                      onClick={() => handleMoveSection(idx, 'up')}
                      disabled={idx === 0 || saving}
                      title="Move Up"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleMoveSection(idx, 'down')}
                      disabled={idx === sections.length - 1 || saving}
                      title="Move Down"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Collections list */}
      {activeTab === 'carousels' && (
      <div className="space-y-3">
        {collections.map((col, idx) => (
          <div
            key={col.id}
            className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all ${
              col.enabled
                ? 'border-white/10 bg-[#0B1528]/80 hover:border-white/20'
                : 'border-white/5 bg-white/[0.01] opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-slate-400">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{col.title}</h3>
                    <span className="rounded-full bg-[#00E5FF]/10 px-2 py-0.5 text-[10px] font-bold text-[#00E5FF] uppercase">
                      {col.type} {col.targetSlug ? `(${col.targetSlug})` : ''}
                    </span>
                    <span className="text-[11px] text-slate-500">Max {col.maxItems} tours</span>
                  </div>
                  {col.subtitle && <p className="text-xs text-slate-400 mt-1">{col.subtitle}</p>}
                  {col.viewAllLink && (
                    <span className="font-mono text-[10px] text-slate-500 mt-1 block">
                      Link: {col.viewAllLink}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 disabled:opacity-30 transition"
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === collections.length - 1}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 disabled:opacity-30 transition"
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleEnabled(col.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                    col.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {col.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {col.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDelete(col.id)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  title="Delete section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#00E5FF]" />
                Add Discovery Carousel
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCollection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Things to Do in El Gouna, Luxury Private Yachts"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted private luxury boat charters"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Collection Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F1D35] px-3 py-2 text-xs text-white focus:border-[#00E5FF] focus:outline-none"
                  >
                    <option value="featured">Featured / Top</option>
                    <option value="destination">By Destination</option>
                    <option value="category">By Category / Theme</option>
                    <option value="popular">Top Rated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Target Slug (Destination / Cat)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. hurghada, sea, safari"
                    value={newTargetSlug}
                    onChange={(e) => setNewTargetSlug(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Max Tours Displayed
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={newMaxItems}
                    onChange={(e) => setNewMaxItems(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    &quot;View all&quot; Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /tours?destination=hurghada"
                    value={newViewAllLink}
                    onChange={(e) => setNewViewAllLink(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] px-5 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
