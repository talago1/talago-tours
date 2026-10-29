'use client';

import { useState, useEffect } from 'react';
import { normalizePhoneForWhatsApp, buildWhatsAppLink } from '@/lib/contactSettings';

export interface ContactSettingsData {
  whatsappNumber: string;
  phoneNumber?: string;
  corporateEmail?: string;
  showWhatsApp?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
}

const DEFAULT_FALLBACK: ContactSettingsData = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+201222434602',
  corporateEmail: 'support@talago-tours.com',
  phoneNumber: '',
  showWhatsApp: true,
  showEmail: true,
  showPhone: false,
};

let cachedSettings: ContactSettingsData | null = null;
let fetchPromise: Promise<ContactSettingsData> | null = null;

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettingsData>(cachedSettings || DEFAULT_FALLBACK);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/api/public/settings/contact')
        .then((r) => (r.ok ? r.json() : null))
        .then((data: ContactSettingsData | null) => {
          if (data && data.whatsappNumber) {
            cachedSettings = data;
            return data;
          }
          return DEFAULT_FALLBACK;
        })
        .catch(() => DEFAULT_FALLBACK);
    }

    fetchPromise.then((resolved) => {
      setSettings(resolved);
      setLoading(false);
    });
  }, []);

  const getWhatsAppUrl = (message?: string) => {
    return buildWhatsAppLink(settings.whatsappNumber, message);
  };

  return {
    ...settings,
    rawWhatsAppNumber: settings.whatsappNumber,
    normalizedWhatsAppNumber: normalizePhoneForWhatsApp(settings.whatsappNumber),
    getWhatsAppUrl,
    loading,
  };
}

