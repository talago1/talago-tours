'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Ship,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Mail,
  Loader2,
  RefreshCw,
  Clock,
  Check,
  X,
  AlertCircle,
  Heart,
  Smartphone,
  SlidersHorizontal,
  ListChecks,
} from 'lucide-react';
import type { SystemSettings } from '@/types/settings';
import type { PartnerApplication } from '@/app/api/public/partners/apply/route';

interface MarketplaceModulesDashboardProps {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export default function MarketplaceModulesDashboard({
  settings,
  setSettings,
}: MarketplaceModulesDashboardProps) {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch('/api/admin/partners/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.warn('Failed to load applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (id: string, status: PartnerApplication['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/partners/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      {/* ─── Module Controls Card ─── */}
      <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00E5FF]" />
            <span className="text-xs font-black uppercase tracking-[0.24em] text-[#00E5FF]">
              System Extensions &amp; Scaling
            </span>
          </div>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Marketplace &amp; Global Modules
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Control platform capabilities for multi-country expansion and external supplier onboarding.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. Multi-Country Expansion */}
          <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 transition-all hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Multi-Country Expansion</h3>
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    🟢 Live &amp; Configurable
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.modules?.additionalCountries ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: { ...prev.modules, additionalCountries: e.target.checked },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#00E5FF] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Allows creating destinations across multiple countries (Egypt 🇪🇬, UAE 🇦🇪, Saudi Arabia 🇸🇦, Turkey 🇹🇷, Greece 🇬🇷, Italy 🇮🇹, Spain 🇪🇸...) with country-specific filters.
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <Link
                href="/admin/destinations"
                className="inline-flex items-center gap-1.5 font-bold text-[#00E5FF] hover:underline"
              >
                <span>Manage Destinations Hub</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 2. Supplier & Partner Onboarding */}
          <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 transition-all hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
                  <Ship className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Supplier Onboarding Portal</h3>
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    🟢 Live Portal at /partners
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.modules?.supplierPortal ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        supplierPortal: e.target.checked,
                        partners: e.target.checked,
                        applications: e.target.checked,
                      },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#00E5FF] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Enables the public B2B onboarding portal at <code className="text-slate-300">/partners</code> for external operators, boat charters, and dive centers to apply and list experiences.
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <Link
                href="/partners"
                target="_blank"
                className="inline-flex items-center gap-1.5 font-bold text-[#FFD700] hover:underline"
              >
                <span>Preview Public /partners Page</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 3. Traveler Wishlist & Bucket List Engine */}
          <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 transition-all hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                  <Heart className="h-5 w-5 fill-rose-500/20" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Wishlist &amp; Bucket List</h3>
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    🟢 Live at /wishlist
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.modules?.wishlist ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        wishlist: e.target.checked,
                        showWishlistInNav: e.target.checked,
                      },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Allows travelers to bookmark experiences, view their saved bucket list at <code className="text-slate-300">/wishlist</code>, and send their dream itinerary directly to WhatsApp Concierge.
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <Link
                href="/wishlist"
                target="_blank"
                className="inline-flex items-center gap-1.5 font-bold text-rose-400 hover:underline"
              >
                <span>View Public /wishlist Page</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* 4. Mobile Quick-Booking & Sticky Bar */}
          <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 transition-all hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Sticky Mobile Booking Bar</h3>
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    🟢 High-Conversion Mobile UX
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.modules?.stickyMobileBookingBar ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        stickyMobileBookingBar: e.target.checked,
                      },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#00E5FF] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Affixes dynamic pricing, available slot indicators, and a 1-tap booking button to the bottom viewport on mobile devices when viewing tour detail pages.
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Optimized for iOS Safari &amp; Android Chrome</span>
            </div>
          </div>

          {/* 5. Activity At-a-Glance & Know Before You Go */}
          <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 transition-all hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Activity At-a-Glance &amp; Guidelines</h3>
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    🟢 GetYourGuide / Viator Standard
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.modules?.activityAtAGlance ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        activityAtAGlance: e.target.checked,
                      },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-400 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Renders instant key specifications (duration, cancellation window, mobile tickets, guide languages, group sizes) and the standardized &quot;Know Before You Go&quot; section on tour pages.
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Essential for conversion &amp; traveler expectations</span>
            </div>
          </div>

          {/* 6. Advanced Faceted Catalog Search */}
          <div className="rounded-2xl border border-white/10 bg-[#070F1E] p-5 transition-all hover:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Faceted Catalog Search</h3>
                  <span className="inline-block mt-0.5 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    🟢 Multi-Faceted Filters Live
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.modules?.facetedFilters ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      modules: {
                        ...prev.modules,
                        facetedFilters: e.target.checked,
                      },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-cyan-400 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
              </label>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Enables granular filtering across catalog listings by duration buckets (&lt;2h, 2-4h, 4-8h, full day), rating tiers (4.5★+, 4.0★+), price ceilings, and inclusions (hotel pickup).
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <Link
                href="/tours"
                target="_blank"
                className="inline-flex items-center gap-1.5 font-bold text-cyan-400 hover:underline"
              >
                <span>Preview /tours Catalog</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Informative Roadmap Notice */}
        <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-xs text-violet-200">
          <div className="flex items-center gap-2 font-bold text-violet-300">
            <Sparkles className="h-4 w-4" />
            <span>Future Phase (Marketplace Commission Engine)</span>
          </div>
          <p className="mt-1 leading-relaxed text-slate-300">
            Affiliate link tracking and promo code campaigns are active via the Promo Codes module. Automated Stripe Connect multi-party payouts for suppliers are scheduled for Phase 8.
          </p>
        </div>
      </div>

      {/* ─── Partner Applications Inbox ─── */}
      <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Partner &amp; Supplier Applications</h3>
              {pendingCount > 0 && (
                <span className="rounded-full bg-[#EAB308] px-2.5 py-0.5 text-xs font-black text-[#070F1E]">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Incoming supplier requests from the public <code className="text-slate-300">/partners</code> portal.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            disabled={loadingApps}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingApps ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingApps ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#00E5FF]" />
            <p className="mt-2 text-xs text-slate-400">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <Ship className="mx-auto h-10 w-10 text-slate-500" />
            <p className="mt-3 text-sm font-bold text-slate-300">No Partner Applications Yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Applications submitted through the <Link href="/partners" target="_blank" className="text-[#00E5FF] underline">/partners</Link> portal will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 font-black uppercase tracking-wider">Company &amp; Contact</th>
                  <th className="pb-3 font-black uppercase tracking-wider">Location</th>
                  <th className="pb-3 font-black uppercase tracking-wider">Category</th>
                  <th className="pb-3 font-black uppercase tracking-wider">Contact Channels</th>
                  <th className="pb-3 font-black uppercase tracking-wider">Status</th>
                  <th className="pb-3 font-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.02]">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-white text-sm">{app.companyName}</div>
                      <div className="text-slate-400 text-xs">{app.contactName}</div>
                      {app.website && (
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#00E5FF] hover:underline"
                        >
                          <span>{app.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </td>

                    <td className="py-4 pr-4 text-slate-300">
                      <div>{app.city ? `${app.city}, ` : ''}{app.country}</div>
                      {app.fleetSize && (
                        <div className="text-[11px] text-slate-500">{app.fleetSize}</div>
                      )}
                    </td>

                    <td className="py-4 pr-4">
                      <span className="rounded-lg bg-white/5 px-2.5 py-1 text-slate-300">
                        {app.category}
                      </span>
                    </td>

                    <td className="py-4 pr-4 space-y-1">
                      <div>
                        <a
                          href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:underline"
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span>{app.phone}</span>
                        </a>
                      </div>
                      <div>
                        <a
                          href={`mailto:${app.email}`}
                          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white"
                        >
                          <Mail className="h-3 w-3" />
                          <span>{app.email}</span>
                        </a>
                      </div>
                    </td>

                    <td className="py-4 pr-4">
                      {app.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2.5 py-1 font-bold text-yellow-300">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                      {app.status === 'REVIEWED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/10 px-2.5 py-1 font-bold text-blue-300">
                          Reviewed
                        </span>
                      )}
                      {app.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 font-bold text-emerald-400">
                          <Check className="h-3 w-3" />
                          Approved
                        </span>
                      )}
                      {app.status === 'DECLINED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2.5 py-1 font-bold text-red-400">
                          <X className="h-3 w-3" />
                          Declined
                        </span>
                      )}
                    </td>

                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        {app.status === 'PENDING' && (
                          <button
                            type="button"
                            disabled={updatingId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'REVIEWED')}
                            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                          >
                            Mark Reviewed
                          </button>
                        )}
                        {app.status !== 'APPROVED' && (
                          <button
                            type="button"
                            disabled={updatingId === app.id}
                            onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                            className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
