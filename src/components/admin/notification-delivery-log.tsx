'use client';

import { useState, useEffect, useCallback } from 'react';
import { Terminal, MessageSquare, Mail, ChevronLeft, ChevronRight, RefreshCw, Phone } from 'lucide-react';

interface LogEntry {
  id: string;
  bookingId: string;
  channel: 'WHATSAPP' | 'EMAIL';
  recipient: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  errorMessage: string | null;
  sentAt: string;
  deliveredAt: string | null;
}

interface LogMeta {
  total: number;
  page: number;
  limit: number;
}

/** Extract a country code prefix from recipient (e.g. "+20" → "EG", "+7" → "RU") */
function guessCountryCode(recipient: string): string {
  const match = recipient.match(/^\+(\d{1,3})/);
  if (!match) return '';
  const code = match[1];
  const map: Record<string, string> = {
    '20': 'EG', '7': 'RU', '49': 'DE', '39': 'IT', '33': 'FR',
    '48': 'PL', '34': 'ES', '44': 'GB', '1': 'US', '971': 'AE',
    '966': 'SA', '974': 'QA', '965': 'KW', '973': 'BH',
  };
  return map[code] || '';
}

const COUNTRY_FLAG: Record<string, string> = {
  EG: '\u{1F1EA}\u{1F1EC}', RU: '\u{1F1F7}\u{1F1FA}', DE: '\u{1F1E9}\u{1F1EA}',
  IT: '\u{1F1EE}\u{1F1F9}', FR: '\u{1F1EB}\u{1F1F7}', PL: '\u{1F1F5}\u{1F1F1}',
  ES: '\u{1F1EA}\u{1F1F8}', GB: '\u{1F1EC}\u{1F1E7}', US: '\u{1F1FA}\u{1F1F8}',
};

const STATUS_DOT: Record<string, { color: string; label: string; glow: string }> = {
  SENT: { color: 'bg-teal-400', label: 'SENT', glow: 'rgba(45,212,191,0.3)' },
  DELIVERED: { color: 'bg-emerald-400', label: 'DELIVERED', glow: 'rgba(52,211,153,0.3)' },
  FAILED: { color: 'bg-rose-500', label: 'FAILED', glow: 'rgba(244,63,94,0.3)' },
};

function LogEvent({ log }: { log: LogEntry }) {
  const dot = STATUS_DOT[log.status] ?? { color: 'bg-slate-500', label: log.status, glow: '' };
  const country = guessCountryCode(log.recipient);
  const flag = COUNTRY_FLAG[country] || '';

  return (
    <div className="group rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-white/[0.08] hover:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Channel icon */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            log.channel === 'WHATSAPP'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}>
            {log.channel === 'WHATSAPP' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {log.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
              </span>
              {/* Country flag badge */}
              {flag && (
                <span className="text-sm leading-none" title={country}>{flag}</span>
              )}
              {/* Status dot + label */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${dot.color}`}
                  style={dot.glow ? { boxShadow: `0 0 6px ${dot.glow}` } : undefined}
                />
                {dot.label}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-slate-500">
              {log.channel === 'WHATSAPP' ? (
                <Phone className="h-3 w-3 text-slate-600" />
              ) : null}
              {log.recipient}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">
            {new Date(log.sentAt).toLocaleString('en-GB', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })}
          </div>
          {log.deliveredAt && (
            <div className="mt-0.5 text-[11px] text-emerald-500/70">
              ✓ {new Date(log.deliveredAt).toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>
      {log.errorMessage && (
        <div className="mt-2 rounded-lg border border-rose-500/10 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
          {log.errorMessage}
        </div>
      )}
    </div>
  );
}

export default function NotificationDeliveryLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [meta, setMeta] = useState<LogMeta>({ total: 0, page: 1, limit: 20 });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterChannel]);

  async function fetchLogs(page: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (filterStatus) params.set('status', filterStatus);
      if (filterChannel) params.set('channel', filterChannel);

      const res = await fetch(`/api/notifications/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setMeta(data.meta);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const handlePrev = useCallback(() => {
    if (meta.page > 1) fetchLogs(meta.page - 1);
  }, [meta.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    if (meta.page * meta.limit < meta.total) fetchLogs(meta.page + 1);
  }, [meta.page, meta.limit, meta.total]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div>
      {/* Terminal header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
          <Terminal className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Delivery Monitor</h2>
          <p className="text-xs text-slate-500">
            {meta.total} total event{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLogs(meta.page)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-400 transition-all hover:border-[#06B6D4]/30 hover:text-[#06B6D4]"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 outline-none transition-all focus:border-[#06B6D4]/40"
        >
          <option value="" className="bg-[#0B1528] text-white">All Channels</option>
          <option value="WHATSAPP" className="bg-[#0B1528] text-white">WhatsApp</option>
          <option value="EMAIL" className="bg-[#0B1528] text-white">Email</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 outline-none transition-all focus:border-[#06B6D4]/40"
        >
          <option value="" className="bg-[#0B1528] text-white">All Statuses</option>
          <option value="SENT" className="bg-[#0B1528] text-white">Sent</option>
          <option value="DELIVERED" className="bg-[#0B1528] text-white">Delivered</option>
          <option value="FAILED" className="bg-[#0B1528] text-white">Failed</option>
        </select>
      </div>

      {/* Log stream */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center">
          <Terminal className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-500">No notification events yet.</p>
          <p className="mt-1 text-xs text-slate-600">
            Events appear here once WhatsApp or email dispatches are triggered.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <LogEvent key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs text-slate-500">
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={meta.page <= 1}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-400 transition-all hover:border-[#06B6D4]/30 hover:text-[#06B6D4] disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={meta.page * meta.limit >= meta.total}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-400 transition-all hover:border-[#06B6D4]/30 hover:text-[#06B6D4] disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
