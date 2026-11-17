'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  Briefcase,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import type {
  CompanyLegalProfile,
  LicenseRecord,
} from '@/types/companyProfile';
import { DEFAULT_COMPANY_PROFILE } from '@/types/companyProfile';
import type { ProfileCompleteness } from '@/lib/companyProfile';

export default function CompanyLegalProfileDashboard() {
  const [profile, setProfile] = useState<CompanyLegalProfile>(DEFAULT_COMPANY_PROFILE);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'identity' | 'licenses' | 'address' | 'operating' | 'disclosure'>('identity');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/company-profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        if (data.completeness) setCompleteness(data.completeness);
      } else {
        setError('Could not load company profile.');
      }
    } catch (e: any) {
      setError(e.message || 'Error loading company profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/admin/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        if (data.completeness) setCompleteness(data.completeness);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save company profile.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error saving profile');
    } finally {
      setSaving(false);
    }
  }

  const addLicense = () => {
    const newLic: LicenseRecord = {
      id: `lic-${Date.now()}`,
      licenseNumber: '',
      licensingAuthority: 'Ministry of Tourism and Antiquities (Egypt)',
      licenseType: 'Tourism Operations / Marketplace Agency',
      issueDate: '',
      expiryDate: '',
      status: 'active',
      isPublic: false,
      notes: '',
    };
    setProfile((prev) => ({
      ...prev,
      licenses: [...prev.licenses, newLic],
    }));
  };

  const removeLicense = (id: string) => {
    setProfile((prev) => ({
      ...prev,
      licenses: prev.licenses.filter((l) => l.id !== id),
    }));
  };

  const updateLicense = (id: string, patch: Partial<LicenseRecord>) => {
    setProfile((prev) => ({
      ...prev,
      licenses: prev.licenses.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Completeness Dashboard ── */}
      <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#00E5FF]" />
              <h2 className="text-lg font-bold text-white">Company & Legal Profile</h2>
              <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                Centralized Governance
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Manage official corporate identity, Egyptian commercial register numbers, tourism licenses, and business operating models securely.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saved ? 'Saved Successfully!' : saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Status */}
        {completeness && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Profile Completeness</span>
              <span className="font-bold text-[#00E5FF]">{completeness.score}% Completed</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  completeness.score >= 80
                    ? 'bg-emerald-400'
                    : completeness.score >= 50
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${completeness.score}%` }}
              />
            </div>

            {completeness.missingFields.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold">Pending Owner Inputs ({completeness.missingFields.length}): </span>
                  <span className="text-slate-300">
                    {completeness.missingFields.join(' · ')}
                  </span>
                </div>
              </div>
            )}

            {completeness.expiredLicenses.length > 0 && (
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-center gap-2 text-xs text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>One or more tourism licenses have expired. Please update with the renewed certificate.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tabbed Navigation ── */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px">
        {[
          { key: 'identity', label: '1. Corporate Identity', icon: Building2 },
          { key: 'licenses', label: '2. Tourism Licenses', icon: ShieldCheck },
          { key: 'address', label: '3. Address & Contacts', icon: MapPin },
          { key: 'operating', label: '4. Operating Model', icon: Briefcase },
          { key: 'disclosure', label: '5. Public Disclosure', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-[#00E5FF] text-[#00E5FF] bg-white/[0.02]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Corporate Identity ── */}
      {activeTab === 'identity' && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#070F1E] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Official Registered Identity</h3>
              <p className="text-xs text-slate-400">
                Information as registered with the Egyptian Ministry of Investment / General Authority for Investment (GAFI) or Commercial Registry.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.identity.isPublic}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      identity: { ...prev.identity, isPublic: e.target.checked },
                    }))
                  }
                  className="rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  {profile.identity.isPublic ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
                  Allow Public Website Disclosure
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Registered Legal Name (English)
              </label>
              <input
                type="text"
                value={profile.identity.legalName}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, legalName: e.target.value },
                  }))
                }
                placeholder="e.g. Talago Tours for Tourism & Transport LLC"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Official registered name on commercial certificate.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Arabic Legal Name (الاسم القانوني بالعربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={profile.identity.arabicLegalName}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, arabicLegalName: e.target.value },
                  }))
                }
                placeholder="مثال: شركة تالاجو للخدمات السياحية والرحلات ذ.م.م"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">الاسم التجاري المعتمد بالسجل التجاري المصري.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Commercial Trading Name
              </label>
              <input
                type="text"
                value={profile.identity.tradingName}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, tradingName: e.target.value },
                  }))
                }
                placeholder="TALAGO"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Consumer brand name displayed across the portal.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Legal Entity Type
              </label>
              <select
                value={profile.identity.entityType}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, entityType: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white focus:border-[#00E5FF] outline-none"
              >
                <option value="Limited Liability Company (LLC)">Limited Liability Company (ذ.م.م / LLC)</option>
                <option value="Joint Stock Company (JSC)">Joint Stock Company (شركة مساهمة / JSC)</option>
                <option value="Sole Proprietorship">Sole Proprietorship (منشأة فردية)</option>
                <option value="One-Person Company">One-Person Company (شركة الشخص الواحد)</option>
                <option value="Partnership">Partnership (شركة تضامن)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Commercial Registration Number (رقم السجل التجاري)
              </label>
              <input
                type="text"
                value={profile.identity.commercialRegisterNumber}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, commercialRegisterNumber: e.target.value },
                  }))
                }
                placeholder="e.g. 123456"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">7 to 9 digit number on your Commercial Registry certificate.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tax Card / Registration Number (رقم البطاقة الضريبية)
              </label>
              <input
                type="text"
                value={profile.identity.taxCardNumber}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, taxCardNumber: e.target.value },
                  }))
                }
                placeholder="e.g. 123-456-789"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">9-digit Egyptian Unified Tax Identification Number.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Egyptian VAT Registration (Optional)
              </label>
              <input
                type="text"
                value={profile.identity.vatNumber}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, vatNumber: e.target.value },
                  }))
                }
                placeholder="e.g. EG-123456789"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Country & Registered Jurisdiction
              </label>
              <input
                type="text"
                value={profile.identity.registeredJurisdiction}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    identity: { ...prev.identity, registeredJurisdiction: e.target.value },
                  }))
                }
                placeholder="Red Sea Governorate, Arab Republic of Egypt"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Tourism Licenses ── */}
      {activeTab === 'licenses' && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#070F1E] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Tourism Licenses & Ministry Authorizations</h3>
              <p className="text-xs text-slate-400">
                Official permits issued by the Egyptian Ministry of Tourism and Antiquities or relevant authorities.
              </p>
            </div>
            <button
              type="button"
              onClick={addLicense}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add License Record</span>
            </button>
          </div>

          {profile.licenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-400">
              <ShieldCheck className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-white">No licenses entered yet</p>
              <p className="text-slate-500 mt-0.5">Click "Add License Record" above to document your operational permits.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.licenses.map((lic, idx) => (
                <div key={lic.id} className="rounded-xl border border-white/10 bg-[#0B1528] p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-[#00E5FF]">License #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLicense(lic.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">License Number</label>
                      <input
                        type="text"
                        value={lic.licenseNumber}
                        onChange={(e) => updateLicense(lic.id, { licenseNumber: e.target.value })}
                        placeholder="e.g. 2481-MOT"
                        className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Licensing Authority</label>
                      <input
                        type="text"
                        value={lic.licensingAuthority}
                        onChange={(e) => updateLicense(lic.id, { licensingAuthority: e.target.value })}
                        placeholder="e.g. Ministry of Tourism"
                        className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={lic.issueDate}
                        onChange={(e) => updateLicense(lic.id, { issueDate: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={lic.expiryDate}
                        onChange={(e) => updateLicense(lic.id, { expiryDate: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={lic.isPublic}
                        onChange={(e) => updateLicense(lic.id, { isPublic: e.target.checked })}
                        className="rounded border-white/20 bg-white/5 text-[#00E5FF]"
                      />
                      <span>Display this license number in website footer / legal disclosures</span>
                    </label>

                    <select
                      value={lic.status}
                      onChange={(e) => updateLicense(lic.id, { status: e.target.value as any })}
                      className="rounded-lg border border-white/10 bg-[#070F1E] px-2.5 py-1 text-xs text-white"
                    >
                      <option value="active">Active & Valid</option>
                      <option value="pending_renewal">Renewal in Progress</option>
                      <option value="expired">Expired</option>
                      <option value="under_review">Under Regulatory Review</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Address & Contacts ── */}
      {activeTab === 'address' && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#070F1E] p-6">
          <div>
            <h3 className="text-base font-bold text-white">Registered Address & Official Contacts</h3>
            <p className="text-xs text-slate-400">
              Designated physical headquarters in Egypt and official channels for customer care, legal notice, and regulatory correspondence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Street Address</label>
              <input
                type="text"
                value={profile.address.registeredStreet}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, registeredStreet: e.target.value },
                  }))
                }
                placeholder="e.g. Sheraton Road / El Dahar"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Building / Office / Suite</label>
              <input
                type="text"
                value={profile.address.buildingOffice}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, buildingOffice: e.target.value },
                  }))
                }
                placeholder="e.g. Marina Plaza, Building 4, Office 12"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={profile.address.city}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value },
                  }))
                }
                placeholder="Hurghada"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Governorate</label>
              <input
                type="text"
                value={profile.address.governorate}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    address: { ...prev.address, governorate: e.target.value },
                  }))
                }
                placeholder="Red Sea Governorate"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Support Email</label>
              <input
                type="email"
                value={profile.contact.officialSupportEmail}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, officialSupportEmail: e.target.value },
                  }))
                }
                placeholder="support@talago-tours.com"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Official WhatsApp Number</label>
              <input
                type="text"
                value={profile.contact.whatsAppNumber}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, whatsAppNumber: e.target.value },
                  }))
                }
                placeholder="+20 100 000 0000"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Notice Contact Email</label>
              <input
                type="email"
                value={profile.contact.legalCorrespondenceEmail}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, legalCorrespondenceEmail: e.target.value },
                  }))
                }
                placeholder="legal@talago-tours.com"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Complaints Contact</label>
              <input
                type="email"
                value={profile.contact.complaintsContactEmail}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, complaintsContactEmail: e.target.value },
                  }))
                }
                placeholder="care@talago-tours.com"
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-[#00E5FF] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Operating Model ── */}
      {activeTab === 'operating' && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#070F1E] p-6">
          <div>
            <h3 className="text-base font-bold text-white">Marketplace Role & Legal Operating Model</h3>
            <p className="text-xs text-slate-400">
              Clear legal delineation of Talago's commercial role in facilitating bookings versus the independent excursion operators who execute the tours.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Commercial Classification
              </label>
              <select
                value={profile.operatingModel.marketplaceRole}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    operatingModel: { ...prev.operatingModel, marketplaceRole: e.target.value as any },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2.5 text-xs text-white focus:border-[#00E5FF] outline-none"
              >
                <option value="intermediary_marketplace">
                  Tourism Booking Marketplace & Intermediary Platform (Facilitating reservations between travellers and vetted local suppliers)
                </option>
                <option value="direct_operator">
                  Direct Excursion Operator (Owns and executes all safari and marine fleets directly)
                </option>
                <option value="hybrid">
                  Hybrid Marketplace & Operator (Operates selected signature tours while hosting partner excursions)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Relationship with Independent Excursion Suppliers
              </label>
              <textarea
                rows={2}
                value={profile.operatingModel.supplierRelationship}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    operatingModel: { ...prev.operatingModel, supplierRelationship: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2 text-xs text-white leading-relaxed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Booking Confirmation & Voucher Issuance Entity
              </label>
              <textarea
                rows={2}
                value={profile.operatingModel.bookingConfirmationEntity}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    operatingModel: { ...prev.operatingModel, bookingConfirmationEntity: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2 text-xs text-white leading-relaxed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Collection & Banking Channel Declaration
              </label>
              <textarea
                rows={2}
                value={profile.operatingModel.paymentCollectionEntity}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    operatingModel: { ...prev.operatingModel, paymentCollectionEntity: e.target.value },
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3.5 py-2 text-xs text-white leading-relaxed outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 5: Public Disclosure Controls ── */}
      {activeTab === 'disclosure' && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-[#070F1E] p-6">
          <div>
            <h3 className="text-base font-bold text-white">Public Disclosure & Website Visibility Controls</h3>
            <p className="text-xs text-slate-400">
              Control exactly which corporate registration numbers and details appear in the public website footer, terms, and vouchers.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
              <input
                type="checkbox"
                checked={profile.disclosure.showCrOnLegalPages}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    disclosure: { ...prev.disclosure, showCrOnLegalPages: e.target.checked },
                  }))
                }
                className="rounded border-white/20 bg-white/5 text-[#00E5FF]"
              />
              <div>
                <p className="text-xs font-bold text-white">Disclose Commercial Register Number on Legal Pages</p>
                <p className="text-[11px] text-slate-400">When enabled, your verified Commercial Register No. appears in Terms of Service and Booking Terms.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
              <input
                type="checkbox"
                checked={profile.disclosure.showTaxCardOnLegalPages}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    disclosure: { ...prev.disclosure, showTaxCardOnLegalPages: e.target.checked },
                  }))
                }
                className="rounded border-white/20 bg-white/5 text-[#00E5FF]"
              />
              <div>
                <p className="text-xs font-bold text-white">Disclose Egyptian Tax Card Number on Legal Pages</p>
                <p className="text-[11px] text-slate-400">Renders the official tax registration ID in compliance sections of Payments & Pricing and Terms.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
              <input
                type="checkbox"
                checked={profile.disclosure.showFullAddressInFooter}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    disclosure: { ...prev.disclosure, showFullAddressInFooter: e.target.checked },
                  }))
                }
                className="rounded border-white/20 bg-white/5 text-[#00E5FF]"
              />
              <div>
                <p className="text-xs font-bold text-white">Display Full Registered Street Address in Website Footer</p>
                <p className="text-[11px] text-slate-400">Shows the complete building/street address alongside Hurghada, Egypt in the customer footer.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
              <input
                type="checkbox"
                checked={profile.disclosure.showOperatingModelSummary}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    disclosure: { ...prev.disclosure, showOperatingModelSummary: e.target.checked },
                  }))
                }
                className="rounded border-white/20 bg-white/5 text-[#00E5FF]"
              />
              <div>
                <p className="text-xs font-bold text-white">Display Marketplace Intermediary Notice in Checkout & Terms</p>
                <p className="text-[11px] text-slate-400">Provides clear customer assurance that tours are conducted by licensed, vetted Egyptian operators.</p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
