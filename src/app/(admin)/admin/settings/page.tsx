'use client';

import { useState, useEffect, useRef } from 'react';
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
  Languages,
  CreditCard,
} from 'lucide-react';
import type { SystemSettings, SiteBanner, HeroLanguageTexts } from '@/types/settings';
import { DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';
import NotificationSettingsDashboard from '@/components/admin/NotificationSettingsDashboard';
import GlobalAssetStudio from '@/components/admin/GlobalAssetStudio';

type ActiveSection = 'contact' | 'financial' | 'paymentMethods' | 'system' | 'banners' | 'notifications';

const HERO_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

const SECTIONS: { key: ActiveSection; label: string; icon: typeof Settings }[] = [
  { key: 'contact', label: 'Contact Info', icon: Phone },
  { key: 'financial', label: 'Currency & Pricing', icon: DollarSign },
  { key: 'paymentMethods', label: 'Payment Methods', icon: CreditCard },
  { key: 'system', label: 'System Toggles', icon: ToggleLeft },
  { key: 'banners', label: 'Hero & Banners', icon: ImageIcon },
  { key: 'notifications', label: 'Notifications', icon: MessageSquare },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('contact');
  const [heroActiveLang, setHeroActiveLang] = useState<string>('en');

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
              paymentMethods: { ...DEFAULT_SYSTEM_SETTINGS.paymentMethods, ...(data.settings.paymentMethods || {}) },
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

  const heroBgUploadRef = useRef<HTMLInputElement>(null);
  const conciergeUploadRef = useRef<HTMLInputElement>(null);
  const aboutUploadRef = useRef<HTMLInputElement>(null);

  async function handleHeroBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      const url = data.uploaded?.[0]?.url;
      if (url) {
        setSettings((prev) => ({ ...prev, banners: { ...prev.banners, heroBackground: url } }));
      }
    } catch {
      // silent
    }
    if (e.target) e.target.value = '';
  }

  async function handleConciergeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      const url = data.uploaded?.[0]?.url;
      if (url) {
        setSettings((prev) => ({ ...prev, banners: { ...prev.banners, conciergePickImage: url } }));
      }
    } catch {
      // silent
    }
    if (e.target) e.target.value = '';
  }

  async function handleAboutUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('files', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      const url = data.uploaded?.[0]?.url;
      if (url) {
        setSettings((prev) => ({ ...prev, banners: { ...prev.banners, aboutPhilosophyImage: url } }));
      }
    } catch {
      // silent
    }
    if (e.target) e.target.value = '';
  }

  function getHeroField(field: keyof HeroLanguageTexts): string {
    const langTrans = settings.banners.heroTranslations?.[heroActiveLang];
    if (langTrans && langTrans[field] !== undefined) return langTrans[field] || '';
    if (heroActiveLang === 'en') {
      return ((settings.banners as Record<string, unknown>)[field] as string) || '';
    }
    return '';
  }

  function updateHeroField(field: keyof HeroLanguageTexts, value: string) {
    setSettings((prev) => {
      const currentTrans = prev.banners.heroTranslations || {};
      const langTrans = currentTrans[heroActiveLang] || {};
      return {
        ...prev,
        banners: {
          ...prev.banners,
          ...(heroActiveLang === 'en' ? { [field]: value } : {}),
          heroTranslations: {
            ...currentTrans,
            [heroActiveLang]: {
              ...langTrans,
              [field]: value,
            },
          },
        },
      };
    });
  }

  function handleCopyFromEnglish() {
    if (heroActiveLang === 'en') return;
    const enTrans = settings.banners.heroTranslations?.en || {};
    const enBadge = enTrans.heroBadge || settings.banners.heroBadge || '';
    const enTitle = enTrans.heroTitle || settings.banners.heroTitle || '';
    const enTagline = enTrans.heroTagline || settings.banners.heroTagline || '';
    const enDesc = enTrans.heroDescription || settings.banners.heroDescription || '';
    const enPrimaryBtn = enTrans.heroPrimaryBtnText || settings.banners.heroPrimaryBtnText || '';
    const enSecondaryBtn = enTrans.heroSecondaryBtnText || settings.banners.heroSecondaryBtnText || '';
    const enCardBadge = enTrans.conciergePickBadge || settings.banners.conciergePickBadge || '';
    const enCardTitle = enTrans.conciergePickTitle || settings.banners.conciergePickTitle || '';
    const enCardDesc = enTrans.conciergePickDescription || settings.banners.conciergePickDescription || '';
    const enCardPrice = enTrans.conciergePickPrice || settings.banners.conciergePickPrice || '';

    setSettings((prev) => ({
      ...prev,
      banners: {
        ...prev.banners,
        heroTranslations: {
          ...(prev.banners.heroTranslations || {}),
          [heroActiveLang]: {
            heroBadge: enBadge,
            heroTitle: enTitle,
            heroTagline: enTagline,
            heroDescription: enDesc,
            heroPrimaryBtnText: enPrimaryBtn,
            heroSecondaryBtnText: enSecondaryBtn,
            conciergePickBadge: enCardBadge,
            conciergePickTitle: enCardTitle,
            conciergePickDescription: enCardDesc,
            conciergePickPrice: enCardPrice,
          },
        },
      },
    }));
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

            {/* Payment Methods Panel */}
            {activeSection === 'paymentMethods' && (
              <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
                    <CreditCard className="h-5 w-5 text-[#00E5FF]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Payment Methods & Checkout Visibility</h2>
                    <p className="text-xs text-slate-500">
                      Enable or disable payment schemes shown to customers during checkout
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Cash on Arrival */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#070F1E] p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Cash on Arrival (Zero Advance)</span>
                        <span className="rounded-full bg-[#EAB308]/15 px-2 py-0.5 text-[10px] font-black uppercase text-[#EAB308]">
                          High Conversion
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 max-w-lg">
                        Allows customers to reserve immediately without entering card details. The full amount is collected in cash on the tour day upon pickup.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            allowPayOnArrival: !prev.paymentMethods?.allowPayOnArrival,
                          },
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                        settings.paymentMethods?.allowPayOnArrival !== false ? 'bg-emerald-400' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                          settings.paymentMethods?.allowPayOnArrival !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Full Online Payment */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#070F1E] p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Full Online Payment (100%)</span>
                        <span className="rounded-full bg-[#00E5FF]/15 px-2 py-0.5 text-[10px] font-black uppercase text-[#00E5FF]">
                          Credit Card / Gateway
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 max-w-lg">
                        Processes 100% of the total booking price online upfront via secure payment gateway. Zero balance due on tour day.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            allowFullOnline: !prev.paymentMethods?.allowFullOnline,
                          },
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                        settings.paymentMethods?.allowFullOnline !== false ? 'bg-[#00E5FF]' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                          settings.paymentMethods?.allowFullOnline !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Online Deposit */}
                  <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Online Deposit (% Advance)</span>
                          <span className="rounded-full bg-[#FFD700]/15 px-2 py-0.5 text-[10px] font-black uppercase text-[#FFD700]">
                            Split Payment
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 max-w-lg">
                          Customer pays a fixed percentage deposit online to lock in the booking, with the remaining balance collected in cash on arrival.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentMethods: {
                              ...prev.paymentMethods,
                              allowDepositOnline: !prev.paymentMethods?.allowDepositOnline,
                            },
                          }))
                        }
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                          settings.paymentMethods?.allowDepositOnline ? 'bg-[#FFD700]' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                            settings.paymentMethods?.allowDepositOnline ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.paymentMethods?.allowDepositOnline && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Default Deposit Percentage:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="5"
                            max="90"
                            step="5"
                            value={settings.paymentMethods?.defaultDepositPercentage || 20}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                paymentMethods: {
                                  ...prev.paymentMethods,
                                  defaultDepositPercentage: parseInt(e.target.value, 10) || 20,
                                },
                              }))
                            }
                            className="w-20 rounded-xl border border-white/10 bg-[#0B1528] px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-[#FFD700]"
                          />
                          <span className="text-sm font-bold text-[#FFD700]">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Link / Concierge Invoice */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#070F1E] p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Payment Link / Concierge Invoice</span>
                        <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-black uppercase text-violet-300">
                          Direct WhatsApp Link
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 max-w-lg">
                        Enables generating and sending direct hosted payment links to guests via WhatsApp or Email from the Admin Bookings Desk.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            allowPaymentLink: !prev.paymentMethods?.allowPaymentLink,
                          },
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                        settings.paymentMethods?.allowPaymentLink !== false ? 'bg-violet-400' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                          settings.paymentMethods?.allowPaymentLink !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
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
                  {/* Hero Section Master Controls */}
                  <div className="rounded-3xl border border-white/10 bg-[#070F1E] p-6 shadow-xl">
                    <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-[#FFD700]" />
                          Hero Section & Background
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Control hero background scenery, headlines, brand slogan, CTAs, and performance metrics
                        </p>
                      </div>
                    </div>

                    {/* Hero Background Scenery */}
                    <div className="mb-6 rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#FFD700]">
                        Hero Background Scenery Image
                      </span>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="url"
                          value={settings.banners.heroBackground}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              banners: { ...prev.banners, heroBackground: e.target.value },
                            }))
                          }
                          placeholder="https://... or click Upload"
                          className="flex-1 rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                        <input
                          ref={heroBgUploadRef}
                          type="file"
                          accept="image/*"
                          onChange={handleHeroBgUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => heroBgUploadRef.current?.click()}
                          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#FFD700] px-5 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-[#070F1E] transition-all hover:bg-[#FFE55C]"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Scenery
                        </button>
                        {settings.banners.heroBackground && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroBackground: '' },
                              }))
                            }
                            className="flex shrink-0 items-center justify-center rounded-2xl border border-white/10 px-4 py-3.5 text-xs text-slate-400 hover:text-red-400"
                            title="Reset to default background"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Multilingual Selector Bar for Hero & Featured Card */}
                    <div className="mb-6 rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4 text-[#00E5FF]" />
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-white">
                            Active Editing Language for Hero & Featured Card
                          </span>
                        </div>
                        {heroActiveLang !== 'en' && (
                          <button
                            type="button"
                            onClick={handleCopyFromEnglish}
                            className="text-xs font-bold text-[#FFD700] hover:underline"
                          >
                            Copy text from English
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {HERO_LANGUAGES.map((lang) => {
                          const isActive = heroActiveLang === lang.code;
                          const hasOverrides = !!settings.banners.heroTranslations?.[lang.code] &&
                            Object.keys(settings.banners.heroTranslations[lang.code] || {}).length > 0;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => setHeroActiveLang(lang.code)}
                              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-[#00E5FF] text-[#070F1E] shadow-lg shadow-[#00E5FF]/30 ring-2 ring-[#00E5FF]'
                                  : 'bg-[#0B1528] text-slate-300 hover:bg-[#0F1E38] hover:text-white border border-white/10'
                              }`}
                            >
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                              {hasOverrides && lang.code !== 'en' && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Editing for <strong className="text-[#00E5FF]">{HERO_LANGUAGES.find((l) => l.code === heroActiveLang)?.label}</strong>. When storefront visitors switch to this language, these custom texts will be shown automatically. If left empty, system default translations will be used.
                      </p>
                    </div>

                    {/* Hero Text Fields & Toggles */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Badge */}
                      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Hero Top Badge
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={settings.banners.showHeroBadge !== false}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  banners: { ...prev.banners, showHeroBadge: e.target.checked },
                                }))
                              }
                              className="rounded border-white/20 bg-[#070F1E] text-[#FFD700] focus:ring-0"
                            />
                            Show Badge
                          </label>
                        </div>
                        <input
                          type="text"
                          value={getHeroField('heroBadge')}
                          onChange={(e) => updateHeroField('heroBadge', e.target.value)}
                          placeholder="Default: Private Red Sea escapes and golden desert expeditions"
                          className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">Leave empty to use automatic multilingual translation.</p>
                      </div>

                      {/* Main Title */}
                      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Main Headline (Title)
                        </span>
                        <input
                          type="text"
                          value={getHeroField('heroTitle')}
                          onChange={(e) => updateHeroField('heroTitle', e.target.value)}
                          placeholder="Default: Unveil Hurghada's Hidden Paradises"
                          className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">Leave empty to use automatic multilingual translation.</p>
                      </div>

                      {/* Brand Tagline */}
                      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#FFD700]">
                            Brand Slogan (Tagline)
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={settings.banners.showHeroTagline !== false}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  banners: { ...prev.banners, showHeroTagline: e.target.checked },
                                }))
                              }
                              className="rounded border-white/20 bg-[#070F1E] text-[#FFD700] focus:ring-0"
                            />
                            Show Slogan
                          </label>
                        </div>
                        <input
                          type="text"
                          value={getHeroField('heroTagline')}
                          onChange={(e) => updateHeroField('heroTagline', e.target.value)}
                          placeholder="Default: Not a Tour. A Memory."
                          className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2.5 text-sm font-semibold text-[#FFD700] outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">Displays prominently in luxury golden italics.</p>
                      </div>

                      {/* Description */}
                      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Hero Description
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={settings.banners.showHeroDescription !== false}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  banners: { ...prev.banners, showHeroDescription: e.target.checked },
                                }))
                              }
                              className="rounded border-white/20 bg-[#070F1E] text-[#FFD700] focus:ring-0"
                            />
                            Show Description
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          value={getHeroField('heroDescription')}
                          onChange={(e) => updateHeroField('heroDescription', e.target.value)}
                          placeholder="Default: Tailored boat trips, secluded reef snorkels, and desert escapes..."
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#070F1E] px-3.5 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">Leave empty to use automatic multilingual translation.</p>
                      </div>
                    </div>

                    {/* CTAs Configuration */}
                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Primary Button */}
                      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Primary CTA Button
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={settings.banners.showPrimaryBtn !== false}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  banners: { ...prev.banners, showPrimaryBtn: e.target.checked },
                                }))
                              }
                              className="rounded border-white/20 bg-[#070F1E] text-[#FFD700] focus:ring-0"
                            />
                            Visible
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={getHeroField('heroPrimaryBtnText')}
                            onChange={(e) => updateHeroField('heroPrimaryBtnText', e.target.value)}
                            placeholder="Text: Explore Tours"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.heroPrimaryBtnLink || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroPrimaryBtnLink: e.target.value },
                              }))
                            }
                            placeholder="Link: /tours"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </div>
                      </div>

                      {/* Secondary Button */}
                      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Secondary CTA Button
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={settings.banners.showSecondaryBtn !== false}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  banners: { ...prev.banners, showSecondaryBtn: e.target.checked },
                                }))
                              }
                              className="rounded border-white/20 bg-[#070F1E] text-[#FFD700] focus:ring-0"
                            />
                            Visible
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={getHeroField('heroSecondaryBtnText')}
                            onChange={(e) => updateHeroField('heroSecondaryBtnText', e.target.value)}
                            placeholder="Text: Verified Reviews"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.heroSecondaryBtnLink || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroSecondaryBtnLink: e.target.value },
                              }))
                            }
                            placeholder="Link: /#verified-reviews"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── /tours Page Hero ── */}
                    <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Tours Page Hero
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Leave blank to keep the current gradient background
                        </span>
                      </div>

                      <div className="grid gap-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                            Background Image
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={settings.banners.toursHeroBackground || ''}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  banners: { ...prev.banners, toursHeroBackground: e.target.value },
                                }))
                              }
                              placeholder="Leave empty for the animated gradient"
                              className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = async () => {
                                  const file = input.files?.[0];
                                  if (!file) return;
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const res = await fetch('/api/admin/media', {
                                      method: 'POST',
                                      body: formData,
                                    });
                                    const data = await res.json();
                                    const url = data.uploaded?.[0]?.url;
                                    if (url) {
                                      setSettings((prev) => ({
                                        ...prev,
                                        banners: { ...prev.banners, toursHeroBackground: url },
                                      }));
                                    }
                                  } catch {
                                    // silent
                                  }
                                };
                                input.click();
                              }}
                              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:border-[#FFD700]"
                            >
                              Upload
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={settings.banners.toursHeroBadge || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, toursHeroBadge: e.target.value },
                              }))
                            }
                            placeholder="Badge: Featured Experiences"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.toursHeroTitle || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, toursHeroTitle: e.target.value },
                              }))
                            }
                            placeholder="Title: Tours & Journeys (leave blank for default)"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </div>

                        <textarea
                          value={settings.banners.toursHeroDescription || ''}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              banners: { ...prev.banners, toursHeroDescription: e.target.value },
                            }))
                          }
                          rows={2}
                          placeholder="Description (leave blank for the translated default)"
                          className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />

                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            type="text"
                            value={settings.banners.toursHeroBtnText || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, toursHeroBtnText: e.target.value },
                              }))
                            }
                            placeholder="Button: Browse All"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.toursHeroRatingValue || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, toursHeroRatingValue: e.target.value },
                              }))
                            }
                            placeholder="Rating: 4.9/5"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.toursHeroRatingLabel || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, toursHeroRatingLabel: e.target.value },
                              }))
                            }
                            placeholder="Rating label: 300+ verified guests"
                            className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trust Proof Metrics */}
                    <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B1528] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Hero Metrics & Trust Stats
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                          <input
                            type="checkbox"
                            checked={settings.banners.showHeroMetrics !== false}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, showHeroMetrics: e.target.checked },
                              }))
                            }
                            className="rounded border-white/20 bg-[#070F1E] text-[#FFD700] focus:ring-0"
                          />
                          Show Metrics Row
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={settings.banners.heroMetric1Value || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroMetric1Value: e.target.value },
                              }))
                            }
                            placeholder="Val 1: 4.98/5"
                            className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.heroMetric1Label || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroMetric1Label: e.target.value },
                              }))
                            }
                            placeholder="Label 1: Verified Score"
                            className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-[11px] text-slate-400 outline-none focus:border-[#FFD700]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={settings.banners.heroMetric2Value || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroMetric2Value: e.target.value },
                              }))
                            }
                            placeholder="Val 2: 1,200+"
                            className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.heroMetric2Label || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroMetric2Label: e.target.value },
                              }))
                            }
                            placeholder="Label 2: Expeditions Hosted"
                            className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-[11px] text-slate-400 outline-none focus:border-[#FFD700]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={settings.banners.heroMetric3Value || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroMetric3Value: e.target.value },
                              }))
                            }
                            placeholder="Val 3: 100%"
                            className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#FFD700]"
                          />
                          <input
                            type="text"
                            value={settings.banners.heroMetric3Label || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, heroMetric3Label: e.target.value },
                              }))
                            }
                            placeholder="Label 3: Private & Tailored"
                            className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-[11px] text-slate-400 outline-none focus:border-[#FFD700]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Featured Tour / Concierge Card (Side Card on Hero) */}
                  <div className="rounded-3xl border border-white/10 bg-[#070F1E] p-6 shadow-xl">
                    <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-[#00E5FF]" />
                          Featured Hero Tour Card (Side Card)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          The prominent floating card positioned on the right of the Hero. Fully customizable image, badges, title, description, price, and target booking link.
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer rounded-full bg-[#0B1528] px-4 py-2 text-xs font-black text-white border border-white/10">
                        <input
                          type="checkbox"
                          checked={settings.banners.showConciergePick !== false}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              banners: { ...prev.banners, showConciergePick: e.target.checked },
                            }))
                          }
                          className="rounded border-white/20 bg-[#070F1E] text-[#00E5FF] focus:ring-0"
                        />
                        Show Card on Hero
                      </label>
                    </div>

                    <div className="space-y-4">
                      {/* Card Image */}
                      <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#00E5FF]">
                          Card Cover Image
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={settings.banners.conciergePickImage}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, conciergePickImage: e.target.value },
                              }))
                            }
                            placeholder="https://... or click Upload"
                            className="flex-1 rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
                          />
                          <input
                            ref={conciergeUploadRef}
                            type="file"
                            accept="image/*"
                            onChange={handleConciergeUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => conciergeUploadRef.current?.click()}
                            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#00E5FF] px-4 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-[#070F1E] transition-all hover:bg-[#5CF1FF]"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Image
                          </button>
                        </div>
                      </label>

                      {/* Card Badge & Price Tag */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Card Top Badge / Chip
                          </span>
                          <input
                            type="text"
                            value={getHeroField('conciergePickBadge')}
                            onChange={(e) => updateHeroField('conciergePickBadge', e.target.value)}
                            placeholder="Default: ⭐ CONCIERGE PICK"
                            className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Price Tag / Subtitle
                          </span>
                          <input
                            type="text"
                            value={getHeroField('conciergePickPrice')}
                            onChange={(e) => updateHeroField('conciergePickPrice', e.target.value)}
                            placeholder="e.g. VIP All-Inclusive or From $120"
                            className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </label>
                      </div>

                      {/* Card Title & Link */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Card Title
                          </span>
                          <input
                            type="text"
                            value={getHeroField('conciergePickTitle')}
                            onChange={(e) => updateHeroField('conciergePickTitle', e.target.value)}
                            placeholder="e.g. Private yacht sunrise to Giftun Island"
                            className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Card Destination Link
                          </span>
                          <input
                            type="text"
                            value={settings.banners.conciergePickLink || ''}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, conciergePickLink: e.target.value },
                              }))
                            }
                            placeholder="e.g. /tours or /tours/orange-bay-luxury-catamaran-vip-day-cruise"
                            className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                        </label>
                      </div>

                      {/* Card Description */}
                      <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Card Description
                        </span>
                        <textarea
                          rows={2}
                          value={getHeroField('conciergePickDescription')}
                          onChange={(e) => updateHeroField('conciergePickDescription', e.target.value)}
                          placeholder="e.g. Champagne breakfast, reef snorkel guide, and flexible return timing."
                          className="w-full resize-none rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Other Page Scenery Banners */}
                  <div className="rounded-3xl border border-white/10 bg-[#070F1E] p-6">
                    <p className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Other Page Banners & Backgrounds</p>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                          className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
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
                          className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
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
                          className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Destinations Background</span>
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
                          className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
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
                          className="w-full rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                        />
                      </label>
                    </div>
                  </div>

                  {/* About Philosophy Image */}
                  <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5">
                    <p className="mb-4 text-sm font-bold text-white">About Page Philosophy Image</p>
                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Philosophy Section Image</span>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={settings.banners.aboutPhilosophyImage}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                banners: { ...prev.banners, aboutPhilosophyImage: e.target.value },
                              }))
                            }
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 rounded-2xl border border-white/10 bg-[#0B1528] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#FFD700]"
                          />
                          <input
                            ref={aboutUploadRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAboutUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => aboutUploadRef.current?.click()}
                            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#FFD700]/10 px-4 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-[#FFD700] transition-all hover:bg-[#FFD700]/20"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                        </div>
                      </label>
                    </div>
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
                            {/* Quick-apply overlay buttons */}
                            <div className="absolute inset-x-0 top-0 flex gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, banners: { ...prev.banners, heroBackground: asset.url } }))}
                                className="flex-1 rounded-lg bg-[#FFD700]/90 px-1.5 py-1 text-[10px] font-black text-[#070F1E] transition-all hover:bg-[#FFD700]"
                                title="Set as hero background"
                              >
                                Hero BG
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, banners: { ...prev.banners, splitSectionLeft: asset.url } }))}
                                className="flex-1 rounded-lg bg-[#06B6D4]/90 px-1.5 py-1 text-[10px] font-black text-white transition-all hover:bg-[#06B6D4]"
                                title="Set as split-section left"
                              >
                                Split L
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, banners: { ...prev.banners, splitSectionRight: asset.url } }))}
                                className="flex-1 rounded-lg bg-[#8B5CF6]/90 px-1.5 py-1 text-[10px] font-black text-white transition-all hover:bg-[#8B5CF6]"
                                title="Set as split-section right"
                              >
                                Split R
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, banners: { ...prev.banners, conciergePickImage: asset.url } }))}
                                className="flex-1 rounded-lg bg-emerald-500/90 px-1.5 py-1 text-[10px] font-black text-white transition-all hover:bg-emerald-500"
                                title="Set as concierge pick card background"
                              >
                                Card
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettings((prev) => ({ ...prev, banners: { ...prev.banners, aboutPhilosophyImage: asset.url } }))}
                                className="flex-1 rounded-lg bg-amber-500/90 px-1.5 py-1 text-[10px] font-black text-white transition-all hover:bg-amber-500"
                                title="Set as about philosophy image"
                              >
                                About
                              </button>
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
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="relative h-32 overflow-hidden rounded-xl bg-[#070F1E]">
                        {settings.banners.heroBackground ? (
                          <img src={settings.banners.heroBackground} alt="Hero" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-600">Hero BG</div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">Hero</span>
                      </div>
                      <div className="relative h-32 overflow-hidden rounded-xl bg-[#070F1E]">
                        {settings.banners.conciergePickImage ? (
                          <img src={settings.banners.conciergePickImage} alt="Card" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-600">Concierge Card</div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">Card</span>
                      </div>
                      <div className="relative h-32 overflow-hidden rounded-xl bg-[#070F1E]">
                        {settings.banners.aboutPhilosophyImage ? (
                          <img src={settings.banners.aboutPhilosophyImage} alt="About" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-600">About</div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">About</span>
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
