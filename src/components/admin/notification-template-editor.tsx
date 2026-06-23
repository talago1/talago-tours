'use client';

import { useState, useEffect, useCallback } from 'react';

interface Template {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL';
  subject: string | null;
  body: string;
  updatedAt: string;
}

const PLACEHOLDER_TOKENS = [
  '{customerName}',
  '{tourTitle}',
  '{departureDate}',
  '{pickupTime}',
  '{pickupLocation}',
  '{voucherUrl}',
  '{bookingReference}',
  '{amountDueOnArrival}',
];

export default function NotificationTemplateEditor() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/notifications/templates');
      if (res.ok) {
        const data = await res.json();

        if (data.length === 0) {
          await seedDefaultTemplates();
          return;
        }

        setTemplates(data);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load templates' });
    }
  }

  async function seedDefaultTemplates() {
    try {
      await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templates: [
            {
              channel: 'WHATSAPP',
              body: `Dear {customerName},\n\nYour {tourTitle} journey is confirmed.\n\nDate: {departureDate}\nPickup: {pickupTime} at {pickupLocation}\nBooking: {bookingReference}\nDue on arrival: {amountDueOnArrival}\n\nView your digital voucher:\n{voucherUrl}\n\nWe look forward to welcoming you.\n— The TALAGO Concierge Team`,
            },
            {
              channel: 'EMAIL',
              subject: 'Your TALAGO Booking Confirmation — {bookingReference}',
              body: `Dear {customerName},\n\nThank you for choosing TALAGO for your Red Sea experience.\n\nWe are pleased to confirm your booking:\n\nTour: {tourTitle}\nDeparture: {departureDate}\nPickup Time: {pickupTime}\nPickup Location: {pickupLocation}\n\nAmount Due on Arrival: {amountDueOnArrival}\nBooking Reference: {bookingReference}\nDigital Voucher: {voucherUrl}\n\nShould you require any arrangements or have special requests, our concierge team remains at your service.\n\nSee you soon,\nThe TALAGO Concierge Team`,
            },
          ],
        }),
      });
      fetchTemplates();
    } catch {
      setMessage({ type: 'error', text: 'Failed to seed default templates' });
    }
  }

  const startEdit = useCallback((t: Template) => {
    setEditingId(t.id);
    setEditBody(t.body);
    setEditSubject(t.subject ?? '');
    setMessage(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditBody('');
    setEditSubject('');
    setMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/notifications/templates/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: editBody,
          ...(editSubject ? { subject: editSubject } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: 'error', text: err.details?.join(', ') ?? err.error ?? 'Save failed' });
        return;
      }

      setMessage({ type: 'success', text: 'Template saved successfully' });
      setEditingId(null);
      fetchTemplates();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  }, [editingId, editBody, editSubject]);

  const insertToken = useCallback((token: string) => {
    setEditBody((prev) => prev + token);
  }, []);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white">Notification Templates</h2>
        <p className="text-sm text-slate-400">Edit message templates for each channel. Changes take effect immediately.</p>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-[#070F1E] p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Available Tokens</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDER_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => insertToken(token)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-[#00E5FF] transition-colors hover:bg-[#00E5FF]/10"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
            : 'border border-red-500/20 bg-red-500/10 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {templates.map((t) => (
        <div key={t.id} className="rounded-2xl border border-white/10 bg-[#0B1528] p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[#00E5FF]/10 px-3 py-1.5 text-xs font-black text-[#00E5FF]">
                {t.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
              </span>
              <span className="text-xs text-slate-500">Updated {new Date(t.updatedAt).toLocaleString()}</span>
            </div>
            {editingId !== t.id && (
              <button
                type="button"
                onClick={() => startEdit(t)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
              >
                Edit
              </button>
            )}
          </div>

          {editingId === t.id ? (
            <div className="space-y-4">
              {t.channel === 'EMAIL' && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Body</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#00E5FF]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-[#00E5FF] px-6 py-2.5 text-sm font-black text-[#070F1E] transition-all hover:bg-[#00E5FF]/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-bold text-slate-300 transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap rounded-2xl bg-[#070F1E] p-4 font-mono text-xs text-slate-400">
              {t.channel === 'EMAIL' && t.subject ? `Subject: ${t.subject}\n\n` : ''}{t.body}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
