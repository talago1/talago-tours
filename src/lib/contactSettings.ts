import { prisma } from '@/lib/prisma';
import { DEFAULT_SETTINGS, parseSettingValue } from '@/lib/systemSettings';
import { normalizePhoneNumber, normalizePhoneForWhatsApp, buildWhatsAppLink } from '@/utils/sanitize';

export { normalizePhoneForWhatsApp, buildWhatsAppLink };

/**
 * Validates whether a string is a potentially valid international phone number.
 * Must contain 8 to 15 digits.
 */
export function isValidInternationalPhone(phone: string): boolean {
  const digits = normalizePhoneForWhatsApp(phone);
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Server-side authoritative getter for public contact settings.
 * Reads directly from PostgreSQL `SystemSetting` key `contact`.
 */
export async function getAuthoritativeContactSettings() {
  try {
    const record = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
    const contact = record
      ? parseSettingValue(record.value, DEFAULT_SETTINGS.contact)
      : DEFAULT_SETTINGS.contact;

    return {
      whatsappNumber: contact.whatsappNumber || DEFAULT_SETTINGS.contact.whatsappNumber,
      corporateEmail: contact.corporateEmail || DEFAULT_SETTINGS.contact.corporateEmail,
      phoneNumber: contact.phoneNumber || DEFAULT_SETTINGS.contact.phoneNumber,
      showWhatsApp: contact.showWhatsApp !== false,
      showEmail: contact.showEmail !== false,
      showPhone: Boolean(contact.showPhone),
      socialLinks: contact.socialLinks || DEFAULT_SETTINGS.contact.socialLinks,
    };
  } catch (err) {
    console.error('[contactSettings] Error fetching authoritative settings:', err);
    return DEFAULT_SETTINGS.contact;
  }
}

