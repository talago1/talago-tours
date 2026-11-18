'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';

interface ExternalProfile {
  id: string;
  platform: string;
  profileUrl: string;
  entityType: string;
  entityId: string | null;
  entityName: string;
  rating: number;
  reviewCount: number;
  lastVerifiedAt: string;
  syncStatus: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

const SUPPORTED_PLATFORMS = [
  'Google Maps',
  'Tripadvisor',
  'Sputnik8',
  'Tripster',
  'GetYourGuide',
  'Viator',
  'Other'
];

export default function ExternalReviewProfilesManager() {
  const [profiles, setProfiles] = useState<ExternalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    platform: 'Google Maps',
    profileUrl: '',
    entityType: 'COMPANY',
    entityName: 'TALAGO Experiences Egypt',
    rating: '4.9',
    reviewCount: '150',
    notes: ''
  });

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/external-reviews');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch profiles');
      setProfiles(data.profiles || []);
    } catch (e: any) {
      setError(e.message || 'Error loading profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      platform: 'Google Maps',
      profileUrl: '',
      entityType: 'COMPANY',
      entityName: 'TALAGO Experiences Egypt',
      rating: '4.9',
      reviewCount: '150',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ExternalProfile) => {
    setEditingId(p.id);
    setForm({
      platform: p.platform,
      profileUrl: p.profileUrl,
      entityType: p.entityType,
      entityName: p.entityName,
      rating: p.rating.toString(),
      reviewCount: p.reviewCount.toString(),
      notes: p.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/external-reviews/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update profile');
        setSuccess('Profile updated successfully');
      } else {
        const res = await fetch('/api/admin/external-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create profile');
        setSuccess('External profile connected successfully');
      }

      setIsModalOpen(false);
      fetchProfiles();
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) {
      setError(e.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/external-reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedNow: true, syncStatus: 'MANUALLY_VERIFIED' })
      });
      if (!res.ok) throw new Error('Verification update failed');
      setSuccess('Verification date updated');
      fetchProfiles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the external review connection for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/external-reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete profile');
      setSuccess('Profile connection removed');
      fetchProfiles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#00E5FF]" />
            External Review Profiles
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Connect genuine ratings from Google Maps, Tripadvisor, Sputnik8, and Tripster.
            External scores remain strictly attributed to their platform and never blended into Talago ratings.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#00E5FF] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 transition hover:bg-[#5CF1FF]"
        >
          <Plus className="h-4 w-4" />
          Connect Profile
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Profile List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#00E5FF]" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-12 text-center">
          <Globe className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <h3 className="text-base font-bold text-white">No External Review Profiles Connected</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            Add official profiles on Google Maps, Tripadvisor, Sputnik8, or Tripster to display verified external ratings with platform attribution.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-5 py-2 text-xs font-black text-[#00E5FF] hover:bg-[#00E5FF]/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Connect Your First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 shadow-xl transition hover:border-[#00E5FF]/30"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black text-[#EAB308]">
                  {p.platform}
                </span>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-300">
                  {p.entityType}
                </span>
              </div>

              <h4 className="mt-3 text-base font-bold text-white line-clamp-1">{p.entityName}</h4>

              {/* Rating & Review Count */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl bg-amber-400/10 px-2.5 py-1 text-sm font-black text-[#EAB308]">
                  <Star className="h-4 w-4 fill-[#EAB308]" />
                  <span>{p.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-400">
                  ({p.reviewCount} verified reviews)
                </span>
              </div>

              {/* Profile Link */}
              <div className="mt-3">
                <a
                  href={p.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Official Profile
                </a>
              </div>

              {/* Verification Timestamp */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-500" />
                  Verified: {new Date(p.lastVerifiedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickVerify(p.id)}
                    title="Mark verified today"
                    className="hover:text-emerald-400 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    title="Edit profile"
                    className="hover:text-[#00E5FF] transition"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.entityName)}
                    title="Delete connection"
                    className="hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-black text-white">
                {editingId ? 'Edit External Review Profile' : 'Connect External Review Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                >
                  {SUPPORTED_PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>{plat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Entity / Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TALAGO Tours Hurghada Hub"
                  value={form.entityName}
                  onChange={(e) => setForm({ ...form, entityName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Official Profile URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://maps.google.com/?cid=..."
                  value={form.profileUrl}
                  onChange={(e) => setForm({ ...form, profileUrl: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rating (0.0 – 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Review Count</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.reviewCount}
                    onChange={(e) => setForm({ ...form, reviewCount: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Entity Scope</label>
                <select
                  value={form.entityType}
                  onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                >
                  <option value="COMPANY">Company-wide (TALAGO Official)</option>
                  <option value="DESTINATION">Destination-specific Hub</option>
                  <option value="TOUR">Specific Tour Product</option>
                  <option value="SUPPLIER">Partner / Supplier</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Internal Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified via Google Business Console on Nov 2026"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-5 py-2 font-black uppercase text-[#070F1E] hover:bg-[#5CF1FF] disabled:opacity-40"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Connect Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
