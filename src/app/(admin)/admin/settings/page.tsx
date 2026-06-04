'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Loader2,
  Phone,
  Mail,
  Globe,
  DollarSign,
  ToggleLeft,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Trash2,
  Upload,
  Plus,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import type { SystemSettings, SiteBanner } from '@/types/settings';
import { DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';
import NotificationSettingsDashboard from '@/components/admin/NotificationSettingsDashboard';
import GlobalAssetStudio from '@/components/admin/GlobalAssetStudio';

type ActiveSection = 'contact' | 'financial' | 'system' | 'banners' | 'notifications';

const SECTIONS: { key: ActiveSection; label: string; icon: typeof Settings }[] = [
  { key: 'contact', label: 'Contact Info', icon: Phone },
  { key: 'financial', label: 'Currency & Pricing', icon: DollarSign },
  { key: 'system', label: 'System Toggles', icon: ToggleLeft },
  { key: 'banners', label: 'Banners & Assets', icon: ImageIcon },
  { key: 'notifications', label: 'Notifications', icon: MessageSquare },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('contact');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const merged: SystemSettings = {
              contact: { ...DEFAULT_SYSTEM_SETTINGS.contact, ...(data.settings.contact || {}) },
              financial: { ...DEFAULT_SYSTEM_SETTINGS.financial, ...(data.settings.financial || {}) },
              system: { ...DEFAULT_SYSTEM_SETTINGS.system, ...(data.settings.system || {}) },
              banners: { ...DEFAULT_SYSTEM_SETTINGS.banners, ...(data.settings.banners || {}) },
            };
            setSettings(merged);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function updateContact(path: string, value: string) {
    setSettings((prev) => {
      const updated = { ...prev };
      if (path === 'whatsappNumber') updated.contact.whatsappNumber = value;
      if (path === 'corporateEmail') updated.contact.corporateEmail = value;
      if (path.startsWith('social.')) {
        const key = path.split('.')[1] as keyof typeof updated.contact.socialLinks;
        updated.contact.socialLinks[key] = value;
      }
      return updated;
    });
  }

  function updateRate(currency: string, value: number) {
    setSettings((prev) => ({
      ...prev,
      financial: {
        ...prev.financial,
        exchangeRates: { ...prev.financial.exchangeRates, [currency]: value },
      },
    }));
  }

  function toggleGateway(gateway: 'paymob' | 'fawry') {
    setSettings((prev) => ({
      ...prev,
      system: {
        ...prev.system,
        paymentGateways: {
          ...prev.system.paymentGateways,
          [gateway]: !prev.system.paymentGateways[gateway],
        },
      },
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070F1E] px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070F1E] px-6 py-8 text-[#F8FAFC] lg:px-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#00E5FF]">
              Configuration Studio
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-5xl">
              System Settings
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Manage global platform configuration, business contact details, currency exchange multipliers,
              and system-wide operational toggles.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#FFD700] px-6 py-3.5 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {/* Saved indicator */}
        {saved && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Settings saved successfully
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-300">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Section navigation */}
          <nav className="flex shrink-0 flex-col gap-2 lg:w-56">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all ${
                    activeSection === section.key
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>

          {/* Settings panels */}
          <div className="flex-1 space-y-6">
            {/* Contact Info Panel */}
            {activeSection === 'contact' && (
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                    <Globe className="h-5 w-5 text-[#00E5FF]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Global Contact Info</h2>
                    <p className="text-xs text-slate-500">Business contact details shown across the platform</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      <Phone className="h-3.5 w-3.5" /> WhatsApp Business Number
                    </span>
                    <input
                      type="text"
                      value={settings.contact.whatsappNumber}
                      onChange={(e) => updateContact('whatsappNumber', e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      <Mail className="h-3.5 w-3.5" /> Corporate Email
                    </span>
                    <input
                      type="email"
                      value={settings.contact.corporateEmail}
                      onChange={(e) => updateContact('corporateEmail', e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Instagram</span>
                      <input
                        type="url"
                        value={settings.contact.socialLinks.instagram}
                        onChange={(e) => updateContact('social.instagram', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Facebook</span>
                      <input
                        type="url"
                        value={settings.contact.socialLinks.facebook}
                        onChange={(e) => updateContact('social.facebook', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Twitter / X</span>
                      <input
                        type="url"
                        value={settings.contact.socialLinks.twitter}
                        onChange={(e) => updateContact('social.twitter', e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#00E5FF]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Panel */}
            {activeSection === 'financial' && (
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                    <DollarSign className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Financial Base Rules</h2>
                    <p className="text-xs text-slate-500">Currency exchange multipliers for multi-currency pricing</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Base Currency</span>
                    <input
                      type="text"
                      value={settings.financial.baseCurrency}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          financial: { ...prev.financial, baseCurrency: e.target.value.toUpperCase() },
                        }))
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#FFD700]"
                    />
                  </label>

                  <p className="text-sm font-bold text-slate-300">Exchange Rates (relative to {settings.financial.baseCurrency})</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(settings.financial.exchangeRates).map(([currency, rate]) => (
                      <label key={currency} className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          {currency}
                        </span>
                        <input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          value={rate}
                          onChange={(e) => updateRate(currency, parseFloat(e.target.value) || 0)}
                          className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#FFD700]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Banners & Assets Panel */}
            {activeSection === 'banners' && (
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                    <ImageIcon className="h-5 w-5 text-[#FFD700]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Global Site Assets & Banners</h2>
                    <p className="text-xs text-slate-500">Manage hero backgrounds, split-section images, and uploaded scenery assets</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Primary Banner URLs */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hero Background</span>
                      <input
                        type="url"
                        value={settings.banners.heroBackground}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            banners: { ...prev.banners, heroBackground: e.target.value },
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Split Section Left</span>
                      <input
                        type="url"
                        value={settings.banners.splitSectionLeft}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            banners: { ...prev.banners, splitSectionLeft: e.target.value },
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Split Section Right</span>
                      <input
                        type="url"
                        value={settings.banners.splitSectionRight}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            banners: { ...prev.banners, splitSectionRight: e.target.value },
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tours Catalog Background</span>
                      <input
                        type="url"
                        value={settings.banners.toursCatalogBackground}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            banners: { ...prev.banners, toursCatalogBackground: e.target.value },
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Destinations Showcase Background</span>
                      <input
                        type="url"
                        value={settings.banners.destinationsBackground}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            banners: { ...prev.banners, destinationsBackground: e.target.value },
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Booking Checkout Background</span>
                      <input
                        type="url"
                        value={settings.banners.bookingCheckoutBackground}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            banners: { ...prev.banners, bookingCheckoutBackground: e.target.value },
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                      />
                    </label>
                  </div>

                  {/* Native File Upload Input */}
                  <GlobalAssetStudio onUploadSuccess={(newAssets) => {
                    const mappedAssets = newAssets.map((asset) => ({
                      id: asset.id,
                      url: asset.url,
                      label: asset.label,
                      section: 'general' as const,
                    }));
                    setSettings((prev) => ({
                      ...prev,
                      banners: {
                        ...prev.banners,
                        assets: [...(prev.banners.assets || []), ...mappedAssets],
                      },
                    }));
                  }} />

                  {/* Asset URL Library */}
                  <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5">
                    <p className="mb-4 text-sm font-bold text-white">Asset URL Library</p>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                        {settings.banners.assets.map((asset) => (
                          <div
                            key={asset.id}
                            className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0B1528]"
                          >
                            <div className="aspect-[16/9] overflow-hidden">
                              <img
                                src={asset.url}
                                alt={asset.label}
                                className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x225/0B1528/5A5A5A?text=Error';
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between p-2.5">
                              <span className="truncate text-xs font-bold text-slate-300">{asset.label}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSettings((prev) => ({
                                    ...prev,
                                    banners: {
                                      ...prev.banners,
                                      assets: prev.banners.assets.filter((a) => a.id !== asset.id),
                                    },
                                  }));
                                }}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 opacity-0 transition-all hover:bg-red-500/10 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>

                  {/* Preview Area */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Live Preview</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="relative h-32 overflow-hidden rounded-xl bg-[#070F1E]">
                        {settings.banners.heroBackground ? (
                          <img src={settings.banners.heroBackground} alt="Hero" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-600">Hero BG</div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">Hero</span>
                      </div>
                      <div className="relative h-32 overflow-hidden rounded-xl bg-[#070F1E]">
                        {settings.banners.splitSectionLeft ? (
                          <img src={settings.banners.splitSectionLeft} alt="Split L" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-600">Split L</div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">Split L</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Toggles Panel */}
            {activeSection === 'system' && (
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
                    <ToggleLeft className="h-5 w-5 text-violet-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">System Toggles</h2>
                    <p className="text-xs text-slate-500">Global operational switches for platform control</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#070F1E] px-5 py-4">
                    <div>
                      <p className="font-bold text-white">Maintenance Mode</p>
                      <p className="text-xs text-slate-500">
                        When enabled, the public site shows a maintenance notice
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          system: { ...prev.system, maintenanceMode: !prev.system.maintenanceMode },
                        }))
                      }
                      className={`relative h-7 w-12 rounded-full transition-all ${
                        settings.system.maintenanceMode ? 'bg-[#FFD700]' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                          settings.system.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Payment Gateways */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#070F1E] px-5 py-4">
                    <div>
                      <p className="font-bold text-white">Paymob Gateway</p>
                      <p className="text-xs text-slate-500">
                        Enable Paymob online payment processing
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGateway('paymob')}
                      className={`relative h-7 w-12 rounded-full transition-all ${
                        settings.system.paymentGateways.paymob ? 'bg-emerald-400' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                          settings.system.paymentGateways.paymob ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#070F1E] px-5 py-4">
                    <div>
                      <p className="font-bold text-white">Fawry Gateway</p>
                      <p className="text-xs text-slate-500">
                        Enable Fawry payment processing
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleGateway('fawry')}
                      className={`relative h-7 w-12 rounded-full transition-all ${
                        settings.system.paymentGateways.fawry ? 'bg-emerald-400' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                          settings.system.paymentGateways.fawry ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Panel */}
            {activeSection === 'notifications' && (
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
                <NotificationSettingsDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
