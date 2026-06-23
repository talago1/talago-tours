'use client';

import { useState } from 'react';
import { MessageSquare, Mail, Smartphone, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface ChannelState {
  enabled: boolean;
  configured: boolean;
  label: string;
  description: string;
}

type Channels = Record<'WHATSAPP' | 'EMAIL' | 'SMS', ChannelState>;

const INITIAL_CHANNELS: Channels = {
  WHATSAPP: {
    enabled: true,
    configured: true,
    label: 'WhatsApp Business',
    description: 'Send booking confirmations, reminders, and voucher links via WhatsApp.',
  },
  EMAIL: {
    enabled: true,
    configured: true,
    label: 'Email Gateway',
    description: 'Deliver detailed booking itineraries and digital vouchers via SMTP.',
  },
  SMS: {
    enabled: false,
    configured: false,
    label: 'SMS Dispatch (Coming Soon)',
    description: 'Dispatch short confirmations and pickup alerts via SMS gateway.',
  },
};

export default function NotificationSettingsDashboard() {
  const [channels, setChannels] = useState<Channels>(INITIAL_CHANNELS);

  function toggleChannel(key: keyof Channels) {
    setChannels((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10">
          <MessageSquare className="h-5 w-5 text-[#00E5FF]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Notification Channel Control</h2>
          <p className="text-xs text-slate-500">
            Configure which channels are active for customer communications
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {(Object.entries(channels) as [keyof Channels, ChannelState][]).map(([key, channel]) => (
          <div
            key={key}
            className={`rounded-2xl border p-5 transition-all ${
              channel.enabled
                ? 'border-white/10 bg-[#070F1E]'
                : 'border-white/5 bg-white/[0.02] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    key === 'WHATSAPP'
                      ? 'bg-emerald-400/10'
                      : key === 'EMAIL'
                        ? 'bg-[#00E5FF]/10'
                        : 'bg-purple-400/10'
                  }`}
                >
                  {key === 'WHATSAPP' ? (
                    <MessageSquare className={`h-5 w-5 ${channel.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  ) : key === 'EMAIL' ? (
                    <Mail className={`h-5 w-5 ${channel.enabled ? 'text-[#00E5FF]' : 'text-slate-500'}`} />
                  ) : (
                    <Smartphone className={`h-5 w-5 ${channel.enabled ? 'text-purple-400' : 'text-slate-500'}`} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">{channel.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{channel.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {channel.configured ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-400">
                    <XCircle className="h-3 w-3" />
                    Not Configured
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => toggleChannel(key)}
                  className={`relative h-7 w-12 rounded-full transition-all ${
                    channel.enabled ? 'bg-[#00E5FF]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-all duration-200 ${
                      channel.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {channel.enabled && key !== 'SMS' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5">
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs text-slate-500">
                  Templates are managed in the{' '}
                  <a href="/admin/notifications" className="font-bold text-[#00E5FF] underline underline-offset-2">
                    Notification Engine
                  </a>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
