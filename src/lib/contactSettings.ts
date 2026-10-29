import { prisma } from '@/lib/prisma';
import { DEFAULT_SETTINGS, parseSettingValue } from '@/lib/systemSettings';

/**
 * Normalizes any phone number into an international E.164-compatible digit string
 * with no leading '+', spaces, dashes, or symbols.
 * Example: "+20 122 243 4602" -> "201222434602"
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

/**
 * Validates whether a string is a potentially valid international phone number.
 * Must contain 8 to 15 digits.
 */
export function isValidInternationalPhone(phone: string): boolean {
  const digits = normalizePhoneForWhatsApp(phone);
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Builds an official WhatsApp link: https://wa.me/<digits>?text=<encoded_message>
 * If phone is empty, falls back to the configured fallback or default.
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const digits = normalizePhoneForWhatsApp(phone);
  if (!digits) return '#';
  if (!message) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
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

