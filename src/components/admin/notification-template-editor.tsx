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
  '{{customer_name}}',
  '{{tour_title}}',
  '{{departure_date}}',
  '{{pickup_time}}',
  '{{pickup_location}}',
  '{{voucher_url}}',
  '{{booking_reference}}',
  '{{amount_due_on_arrival}}',
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
              body: `Hi {{customer_name}}, your tour {{tour_title}} is confirmed!\n\nDate: {{departure_date}}\nPickup: {{pickup_time}} at {{pickup_location}}\nBooking: {{booking_reference}}\nDue on arrival: {{amount_due_on_arrival}}\n\nView voucher: {{voucher_url}}`,
            },
            {
              channel: 'EMAIL',
              subject: 'Your TALAGO Booking Confirmation - {{booking_reference}}',
              body: `Dear {{customer_name}},\n\nWe're excited to confirm your booking for:\n\nTour: {{tour_title}}\nDeparture: {{departure_date}}\nPickup Time: {{pickup_time}}\nPickup Location: {{pickup_location}}\n\nAmount Due on Arrival: {{amount_due_on_arrival}}\nBooking Reference: {{booking_reference}}\nView Your Voucher: {{voucher_url}}\n\nSee you soon!\nThe TALAGO Team`,
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
        <h2 className="text-lg font-semibold text-gray-900">Notification Templates</h2>
        <p className="text-sm text-gray-500">Edit message templates for each channel. Changes take effect immediately.</p>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-xs font-medium text-gray-600">Available Tokens</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDER_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => insertToken(token)}
              className="rounded bg-white px-2 py-1 font-mono text-xs text-[#FF5B00] shadow-sm ring-1 ring-gray-200 hover:bg-[#FFF0E8]"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {templates.map((t) => (
        <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{t.channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}</span>
              <span className="ml-2 text-xs text-gray-400">Last updated: {new Date(t.updatedAt).toLocaleString()}</span>
            </div>
            {editingId !== t.id && (
              <button
                type="button"
                onClick={() => startEdit(t)}
                className="rounded px-3 py-1 text-sm text-[#FF5B00] hover:bg-[#FFF0E8]"
              >
                Edit
              </button>
            )}
          </div>

          {editingId === t.id ? (
            <div className="space-y-3">
              {t.channel === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Body</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={8}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#FF5B00] focus:outline-none focus:ring-1 focus:ring-[#FF5B00]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#FF5B00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E55200] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 font-mono text-xs text-gray-600">
              {t.channel === 'EMAIL' && t.subject ? `Subject: ${t.subject}\n\n` : ''}{t.body}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
