'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
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
  Headphones,
  Languages,
  Car,
  Smartphone,
  MapPin,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import type { TourServiceItem } from '@/types/services';

const AVAILABLE_ICONS: { [key: string]: typeof ShieldCheck } = {
  Languages,
  Headphones,
  ShieldCheck,
  Car,
  Smartphone,
  MapPin,
  Clock,
  HeartHandshake,
  Sparkles,
};

export default function TourServicesDashboard() {
  const [services, setServices] = useState<TourServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New service modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('ShieldCheck');
  const [newBadge, setNewBadge] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (data.success && Array.isArray(data.services)) {
        setServices(data.services);
      } else {
        setError(data.error || 'Failed to load services.');
      }
    } catch (e: any) {
      setError(e.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string) {
    const updated = services.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    setServices(updated);
    await persistServices(updated);
  }

  async function persistServices(nextList: TourServiceItem[]) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: nextList }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save services.');
      }
    } catch (e: any) {
      setError(e.message || 'Error saving services.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const generatedId = newId.trim() || newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const payload: Partial<TourServiceItem> = {
        id: generatedId,
        name: newName.trim(),
        description: newDesc.trim(),
        icon: newIcon,
        isActive: newIsActive,
        badgeText: newBadge.trim() || undefined,
      };

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.services)) {
        setServices(data.services);
        setShowAddModal(false);
        setNewId('');
        setNewName('');
        setNewDesc('');
        setNewBadge('');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to add service.');
      }
    } catch (e: any) {
      setError(e.message || 'Error adding service.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this service definition?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to delete service.');
      }
    } catch (e: any) {
      setError(e.message || 'Error deleting service.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-[#0B1528]/80 p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Tour Services &amp; On-Trip Support</h2>
              <p className="text-xs text-slate-400">
                Manage the catalog of official tour services (e.g. Live Tour Guide, 24/7 Backup Service) assignable to tours.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadServices()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 text-xs font-bold text-black transition-all hover:opacity-90 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Service
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
          <span>Tour services updated successfully.</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const IconComp = AVAILABLE_ICONS[service.icon] || ShieldCheck;
          return (
            <div
              key={service.id}
              className={`rounded-2xl border border-white/10 bg-[#0B1528]/80 p-5 backdrop-blur-xl transition-all ${
                !service.isActive ? 'opacity-50' : 'hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{service.name}</h3>
                      {service.badgeText && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          {service.badgeText}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">ID: {service.id}</span>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">{service.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(service.id)}
                    className={`rounded-lg p-1.5 transition-colors ${
                      service.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-white/10'
                    }`}
                    title={service.isActive ? 'Active (Click to disable)' : 'Disabled (Click to activate)'}
                  >
                    {service.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                    title="Delete service from catalog"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Add New Tour Service
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Live Tour Guide, 24/7 Backup Service"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Unique ID / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. live-tour-guide (optional, auto-generated)"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what the service provides to the customer..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Icon
                  </label>
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F1D35] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  >
                    {Object.keys(AVAILABLE_ICONS).map((iconKey) => (
                      <option key={iconKey} value={iconKey}>
                        {iconKey}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guaranteed"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
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
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
