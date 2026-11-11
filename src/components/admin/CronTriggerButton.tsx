'use client';

import { useState } from 'react';
import { PlayCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface CronResult {
  processed?: number;
  abandoned?: number;
  reviews?: number;
  errors?: string[];
}

export default function CronTriggerButton() {
  const [state, setState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<CronResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTrigger = async () => {
    if (state === 'running') return;
    setState('running');
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // sends the admin session cookie
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(json?.error ?? `HTTP ${res.status}`);
        setState('error');
        return;
      }

      setResult(json);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Request failed');
      setState('error');
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/20">
      <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-[#00E5FF]">
        Manual Automation Trigger
      </h2>
      <p className="mb-5 text-xs text-slate-400">
        Runs the daily cron immediately: abandoned-checkout recovery + post-tour review invitations.
        Normally fires at 06:00 UTC.
      </p>

      <button
        onClick={handleTrigger}
        disabled={state === 'running'}
        className="flex items-center gap-2 rounded-xl bg-[#00473F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005a50] disabled:opacity-60 transition-colors"
      >
        {state === 'running' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlayCircle className="h-4 w-4" />
        )}
        {state === 'running' ? 'Running…' : 'Run Daily Automation Now'}
      </button>

      {state === 'success' && result && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Automation completed</p>
            {result.abandoned != null && (
              <p>Abandoned recovery: {result.abandoned} processed</p>
            )}
            {result.reviews != null && (
              <p>Review invitations: {result.reviews} sent</p>
            )}
            {result.errors && result.errors.length > 0 && (
              <p className="mt-1 text-amber-400">Warnings: {result.errors.join('; ')}</p>
            )}
          </div>
        </div>
      )}

      {state === 'error' && errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Failed to trigger automation</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
