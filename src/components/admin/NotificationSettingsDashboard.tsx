'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  CheckCircle2,
  Bell,
  Send,
  Loader2,
  Save,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { SystemSettings } from '@/types/settings';

interface CredentialsStatus {
  telegram: boolean;
  whatsapp: boolean;
  email: boolean;
}

interface NotificationSettingsDashboardProps {
  settings?: SystemSettings;
  setSettings?: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
}

export default function NotificationSettingsDashboard({
  settings: propSettings,
  setSettings: propSetSettings,
  onSave: propOnSave,
  saving: propSaving,
}: NotificationSettingsDashboardProps) {
  const [internalSettings, setInternalSettings] = useState<SystemSettings['notifications'] | null>(null);
  const [credentials, setCredentials] = useState<CredentialsStatus>({
    telegram: false,
    whatsapp: false,
    email: false,
  });
  const [loading, setLoading] = useState(!propSettings);
  const [localSaving, setLocalSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load credentials status and fallback settings if not provided via props
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.credentialsStatus) {
            setCredentials(data.credentialsStatus);
          }
          if (!propSettings && data.settings?.notifications) {
            setInternalSettings(data.settings.notifications);
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propSettings]);

  const activeNotifs = propSettings?.notifications ?? internalSettings ?? {
    telegram: {
      enabled: true,
      events: { newBooking: true, newLead: true, statusChange: true, newMessage: true },
    },
    whatsapp: {
      enabled: true,
      events: { newBooking: true, statusChange: true, newMessage: false },
    },
    email: {
      enabled: false,
      events: { newBooking: false, statusChange: false },
    },
    inSite: {
      enabled: true,
      events: { newBooking: true, newLead: true, statusChange: true, newMessage: true },
    },
  };

  const isSaving = propSaving ?? localSaving;

  function updateChannelEnabled(channel: keyof typeof activeNotifs, enabled: boolean) {
    if (propSetSettings) {
      propSetSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [channel]: {
            ...prev.notifications[channel],
            enabled,
          },
        },
      }));
    } else {
      setInternalSettings((prev) => prev ? ({
        ...prev,
        [channel]: {
          ...prev[channel],
          enabled,
        },
      }) : null);
    }
  }

  function updateEvent(channel: keyof typeof activeNotifs, eventKey: string, val: boolean) {
    if (propSetSettings) {
      propSetSettings((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [channel]: {
            ...prev.notifications[channel],
            events: {
              ...(prev.notifications[channel] as any).events,
              [eventKey]: val,
            },
          },
        },
      }));
    } else {
      setInternalSettings((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [channel]: {
            ...prev[channel],
            events: {
              ...(prev[channel] as any).events,
              [eventKey]: val,
            },
          },
        };
      });
    }
  }

  async function handleSaveClick() {
    if (propOnSave) {
      await propOnSave();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    }

    setLocalSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: activeNotifs }),
      });
      if (!res.ok) throw new Error('Failed to save notification settings');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setLocalSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#00E5FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
            <Bell className="h-5 w-5 text-[#00E5FF]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Notification Operations Engine</h2>
            <p className="text-xs text-slate-400">
              Configure delivery channels, credential verification, and event dispatch rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Settings Saved
            </span>
          )}
          {errorMsg && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              {errorMsg}
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0099FF] px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#00E5FF]/20 hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Grid of channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telegram Channel */}
        <div className={`rounded-2xl border p-5 transition-all ${activeNotifs.telegram.enabled ? 'border-white/10 bg-[#070F1E]' : 'border-white/5 bg-white/[0.02] opacity-60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">Telegram Alerts</h3>
                  {credentials.telegram ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      <AlertTriangle className="h-3 w-3" /> Missing Keys
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Instant admin alerts sent to Telegram bot / admin chat ID.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateChannelEnabled('telegram', !activeNotifs.telegram.enabled)}
              className={`relative h-6 w-11 rounded-full transition-all shrink-0 ${activeNotifs.telegram.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all ${activeNotifs.telegram.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {activeNotifs.telegram.enabled && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Triggers:</span>
              <div className="mt-2 space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.telegram.events.newBooking}
                    onChange={(e) => updateEvent('telegram', 'newBooking', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  New Confirmed Booking Alert
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.telegram.events.newLead}
                    onChange={(e) => updateEvent('telegram', 'newLead', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  New Booking Interest / Preliminary Request
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.telegram.events.statusChange}
                    onChange={(e) => updateEvent('telegram', 'statusChange', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Booking Status Change (Cancelled / Completed / Confirmed)
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.telegram.events.newMessage}
                    onChange={(e) => updateEvent('telegram', 'newMessage', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  New Customer Chat Message Alert
                </label>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Channel */}
        <div className={`rounded-2xl border p-5 transition-all ${activeNotifs.whatsapp.enabled ? 'border-white/10 bg-[#070F1E]' : 'border-white/5 bg-white/[0.02] opacity-60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">WhatsApp Business</h3>
                  {credentials.whatsapp ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      <AlertTriangle className="h-3 w-3" /> Missing Keys
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Sends automated boarding pass link and booking updates directly to guests via Green-API.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateChannelEnabled('whatsapp', !activeNotifs.whatsapp.enabled)}
              className={`relative h-6 w-11 rounded-full transition-all shrink-0 ${activeNotifs.whatsapp.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all ${activeNotifs.whatsapp.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {activeNotifs.whatsapp.enabled && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Triggers:</span>
              <div className="mt-2 space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.whatsapp.events.newBooking}
                    onChange={(e) => updateEvent('whatsapp', 'newBooking', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Send Booking Confirmation & Boarding Pass link to Guest
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.whatsapp.events.statusChange}
                    onChange={(e) => updateEvent('whatsapp', 'statusChange', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Send Status Updates to Guest WhatsApp
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Email Channel */}
        <div className={`rounded-2xl border p-5 transition-all ${activeNotifs.email.enabled ? 'border-white/10 bg-[#070F1E]' : 'border-white/5 bg-white/[0.02] opacity-60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">Email Gateway</h3>
                  {credentials.email ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      <AlertTriangle className="h-3 w-3" /> Resend Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Transactional email delivery for itinerary confirmations and voucher PDFs.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateChannelEnabled('email', !activeNotifs.email.enabled)}
              className={`relative h-6 w-11 rounded-full transition-all shrink-0 ${activeNotifs.email.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all ${activeNotifs.email.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {activeNotifs.email.enabled && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Triggers:</span>
              <div className="mt-2 space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.email.events.newBooking}
                    onChange={(e) => updateEvent('email', 'newBooking', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Send Booking Confirmation Email to Guest
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.email.events.statusChange}
                    onChange={(e) => updateEvent('email', 'statusChange', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Send Status Modification Notifications to Guest
                </label>
              </div>
            </div>
          )}
        </div>

        {/* In-Site / Admin Notification Log */}
        <div className={`rounded-2xl border p-5 transition-all ${activeNotifs.inSite.enabled ? 'border-white/10 bg-[#070F1E]' : 'border-white/5 bg-white/[0.02] opacity-60'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-400/10 text-purple-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">In-Site & Admin CRM Logs</h3>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Database Native
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Records all booking events into the database and syncs them to the unified Bookings workspace.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateChannelEnabled('inSite', !activeNotifs.inSite.enabled)}
              className={`relative h-6 w-11 rounded-full transition-all shrink-0 ${activeNotifs.inSite.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all ${activeNotifs.inSite.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {activeNotifs.inSite.enabled && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Triggers:</span>
              <div className="mt-2 space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.inSite.events.newBooking}
                    onChange={(e) => updateEvent('inSite', 'newBooking', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Log New Confirmed Bookings
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.inSite.events.newLead}
                    onChange={(e) => updateEvent('inSite', 'newLead', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Log Preliminary Inquiries & Leads
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.inSite.events.statusChange}
                    onChange={(e) => updateEvent('inSite', 'statusChange', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Log Status Transitions
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeNotifs.inSite.events.newMessage}
                    onChange={(e) => updateEvent('inSite', 'newMessage', e.target.checked)}
                    className="rounded border-white/20 bg-slate-800 text-[#00E5FF] focus:ring-0"
                  />
                  Record In-Site Live Chat Inquiries
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
