'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import type { ManagedLanguage } from '@/types/languages';

export default function LanguageManagerDashboard() {
  const [languages, setLanguages] = useState<ManagedLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New language form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newNativeName, setNewNativeName] = useState('');
  const [newFlag, setNewFlag] = useState('🌐');
  const [newDirection, setNewDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newIncludeInAi, setNewIncludeInAi] = useState(true);

  // Deletion confirm state
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{
    code: string;
    message: string;
    usage?: { tourCount: number; destinationCount: number };
  } | null>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  async function loadLanguages() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/languages?usage=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.languages)) {
        setLanguages(data.languages);
      } else {
        setError(data.error || 'Failed to load languages.');
      }
    } catch (e: any) {
      setError(e.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(code: string) {
    const updated = languages.map((l) => (l.code === code ? { ...l, isActive: !l.isActive } : l));
    setLanguages(updated);
    await persistLanguages(updated);
  }

  async function handleToggleAi(code: string) {
    const updated = languages.map((l) =>
      l.code === code ? { ...l, includeInTranslations: !l.includeInTranslations } : l
    );
    setLanguages(updated);
    await persistLanguages(updated);
  }

  async function handleToggleDirection(code: string) {
    const updated: ManagedLanguage[] = languages.map((l) =>
      l.code === code ? { ...l, direction: (l.direction === 'ltr' ? 'rtl' : 'ltr') as 'ltr' | 'rtl' } : l
    );
    setLanguages(updated);
    await persistLanguages(updated);
  }

  async function handleSetSource(code: string) {
    const updated = languages.map((l) => ({
      ...l,
      isSource: l.code === code,
      // Source language does not need AI translation into itself
      includeInTranslations: l.code === code ? false : l.includeInTranslations,
    }));
    setLanguages(updated);
    await persistLanguages(updated);
  }

  async function persistLanguages(nextList: ManagedLanguage[]) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languages: nextList }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save language configuration.');
      }
    } catch (e: any) {
      setError(e.message || 'Error saving language configuration.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLanguage(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const payload: Partial<ManagedLanguage> = {
        code: newCode.trim().toLowerCase(),
        displayName: newDisplayName.trim() || newCode.trim().toUpperCase(),
        nativeName: newNativeName.trim() || newDisplayName.trim() || newCode.trim().toUpperCase(),
        flag: newFlag.trim() || '🌐',
        direction: newDirection,
        isActive: newIsActive,
        includeInTranslations: newIncludeInAi,
        isSource: false,
      };

      const res = await fetch('/api/admin/languages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.languages)) {
        setLanguages(data.languages);
        setShowAddModal(false);
        setNewCode('');
        setNewDisplayName('');
        setNewNativeName('');
        setNewFlag('🌐');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to add language.');
      }
    } catch (e: any) {
      setError(e.message || 'Error adding language.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(code: string, force = false) {
    setDeletingCode(code);
    setError(null);
    try {
      const res = await fetch(`/api/admin/languages?code=${code}${force ? '&force=true' : ''}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setLanguages(data.languages);
        setDeleteWarning(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else if (!data.canSafelyDelete) {
        setDeleteWarning({
          code,
          message: data.error,
          usage: data.usage,
        });
      } else {
        setError(data.error || 'Failed to delete language.');
      }
    } catch (e: any) {
      setError(e.message || 'Error deleting language.');
    } finally {
      setDeletingCode(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-[#0B1528]/80 p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Dynamic Language Management</h2>
              <p className="text-xs text-slate-400">
                Configure languages, directions, public storefront visibility, and AI translation targets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLanguages()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] px-4 py-2 text-xs font-bold text-black transition-all hover:opacity-90 shadow-lg shadow-[#00E5FF]/20"
          >
            <Plus className="h-4 w-4" />
            Add Language
          </button>
        </div>
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
          <span>Language settings saved successfully.</span>
        </div>
      )}

      {/* Delete safety warning modal / banner */}
      {deleteWarning && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-amber-300">Existing Translations Detected</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{deleteWarning.message}</p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleToggleActive(deleteWarning.code);
                    setDeleteWarning(null);
                  }}
                  className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
                >
                  Disable Publicly Instead (Recommended)
                </button>
                <button
                  onClick={() => handleDelete(deleteWarning.code, true)}
                  className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
                >
                  Confirm Force Delete From Config
                </button>
                <button
                  onClick={() => setDeleteWarning(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language table */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1528]/80 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.03] text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-3">Code</th>
                <th className="py-3.5 px-3">Direction</th>
                <th className="py-3.5 px-3 text-center">Storefront Visible</th>
                <th className="py-3.5 px-3 text-center">AI Translate Target</th>
                <th className="py-3.5 px-3 text-center">Role</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {languages.map((lang) => (
                <tr
                  key={lang.code}
                  className={`transition-colors hover:bg-white/[0.02] ${
                    !lang.isActive ? 'opacity-60 bg-white/[0.01]' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {lang.displayName}
                          <span className="text-slate-400 font-normal">({lang.nativeName})</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-[11px] rounded bg-white/5 px-2 py-0.5 text-slate-300 font-semibold border border-white/5">
                      {lang.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => handleToggleDirection(lang.code)}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      title="Click to toggle text direction (LTR / RTL)"
                    >
                      <ArrowRightLeft className="h-3 w-3 text-slate-400" />
                      <span className={lang.direction === 'rtl' ? 'text-amber-400 font-bold' : ''}>
                        {lang.direction.toUpperCase()}
                      </span>
                    </button>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleToggleActive(lang.code)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                        lang.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-500 border border-white/10'
                      }`}
                    >
                      {lang.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {lang.isActive ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    {lang.isSource ? (
                      <span className="text-[11px] text-slate-500 italic">Source (N/A)</span>
                    ) : (
                      <button
                        onClick={() => handleToggleAi(lang.code)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                          lang.includeInTranslations && lang.isActive
                            ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30'
                            : 'bg-white/5 text-slate-500 border border-white/10'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {lang.includeInTranslations ? 'Eligible' : 'Skipped'}
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    {lang.isSource ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 px-2.5 py-0.5 text-[10px] font-extrabold text-[#00E5FF]">
                        <ShieldCheck className="h-3 w-3" />
                        PRIMARY SOURCE
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetSource(lang.code)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                        title="Set as primary source language"
                      >
                        Make Source
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!lang.isSource && (
                      <button
                        onClick={() => handleDelete(lang.code)}
                        disabled={deletingCode === lang.code}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        title="Delete language"
                      >
                        {deletingCode === lang.code ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="border-t border-white/10 bg-white/[0.01] p-4 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#00E5FF]" />
            <span>
              <strong>{languages.filter((l) => l.isActive).length}</strong> active languages •{' '}
              <strong>{languages.filter((l) => !l.isSource && l.includeInTranslations && l.isActive).length}</strong> AI translation targets
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Disabling hides language from public storefront without losing existing translations.
          </span>
        </div>
      </div>

      {/* Add Language Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#00E5FF]" />
                Add New Language
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLanguage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Locale Code (ISO)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ar, nl, tr"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                    maxLength={10}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Flag Emoji
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 🇸🇦, 🇳🇱, 🇹🇷"
                    value={newFlag}
                    onChange={(e) => setNewFlag(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Display Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arabic, Dutch, Turkish"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Native Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. العربية, Nederlands, Türkçe"
                  value={newNativeName}
                  onChange={(e) => setNewNativeName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Text Direction
                </label>
                <select
                  value={newDirection}
                  onChange={(e) => setNewDirection(e.target.value as 'ltr' | 'rtl')}
                  className="w-full rounded-xl border border-white/10 bg-[#0F1D35] px-3 py-2 text-xs text-white focus:border-[#00E5FF] focus:outline-none"
                >
                  <option value="ltr">Left to Right (LTR)</option>
                  <option value="rtl">Right to Left (RTL - Arabic, Hebrew, etc.)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                  />
                  <span>Show in public storefront language selector</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newIncludeInAi}
                    onChange={(e) => setNewIncludeInAi(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                  />
                  <span>Include in automatic AI tour translation jobs</span>
                </label>
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
                  Save Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
