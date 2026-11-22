/**
 * Input Sanitization & Anti-XSS Utility
 * Defensive protection for all public form inputs, reviews, and checkout payloads.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /javascript:[^"']*/gi,
  /data:text\/html[^"']*/gi,
  /on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, // onerror=, onload=, onclick=
];

/**
 * Strips HTML control tags, removes script injections, and escapes residual HTML symbols.
 */
export function sanitizeText(val: unknown, maxLength = 2000): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();

  // Strip null bytes and control chars
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    str = str.replace(pattern, '');
  }

  // Escape HTML entities to prevent DOM/XSS injection
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  if (maxLength > 0 && str.length > maxLength) {
    str = str.slice(0, maxLength);
  }

  return str;
}

/**
 * Sanitizes plain single-line names, titles, or references.
 */
export function sanitizePlain(val: unknown, maxLength = 100): string {
  if (!val) return '';
  const text = sanitizeText(val, maxLength);
  // Remove line breaks
  return text.replace(/[\r\n\t]+/g, ' ').trim();
}

/**
 * Validates and normalizes email address.
 */
export function sanitizeEmail(val: unknown): string {
  if (!val) return '';
  const str = String(val).trim().toLowerCase();
  // Safe characters only
  return str.replace(/[^a-z0-9._%+-@]/g, '').slice(0, 254);
}

/**
 * Normalizes an international phone number to canonical E.164 format.
 * - Handles Egypt (+20):
 *   - Domestic 010, 011, 012, 015 (11 digits, e.g. 01012345678) -> +201012345678 (single removal of leading zero)
 *   - +20 followed by domestic 0 (e.g. +2001012345678) -> +201012345678
 *   - Raw without + (e.g. 201012345678 or 2001012345678) -> +201012345678
 *   - National without leading 0 (e.g. 1012345678 with defaultDial +20) -> +201012345678
 *   - Already normalized (e.g. +201012345678) -> +201012345678 (idempotent, never produces +21...)
 *   - Never duplicates country code (+20201012345678 -> +201012345678)
 * - Handles general international numbers:
 *   - Strips domestic trunk zero where appropriate (e.g. +4407... -> +447..., +4901... -> +491...)
 *   - Never strips zeroes belonging to country codes (e.g. +380 Ukraine, +20 Egypt, +502, etc.)
 *   - Never removes significant digits
 */
export function normalizePhoneNumber(raw: unknown, defaultDial = '+20'): string {
  if (!raw) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // Remove whitespace, dashes, parentheses, dots
  str = str.replace(/[\s\-\(\)\.]/g, '');

  // Handle double zero international prefix (e.g. 002010... -> +2010...)
  if (str.startsWith('00')) {
    str = '+' + str.slice(2);
  }

  // Handle repeated pluses
  str = str.replace(/^\++/, '+');

  const hasPlus = str.startsWith('+');
  let digits = str.replace(/\D/g, '');
  if (!digits) return '';

  const cleanDefaultDial = defaultDial.startsWith('+') ? defaultDial : `+${defaultDial}`;
  const defaultDialDigits = cleanDefaultDial.replace(/\D/g, '');

  // 1. Check for repeated country code (e.g. 20201012345678 -> 201012345678)
  if (digits.startsWith('2020') && digits.length >= 12) {
    const afterFirst20 = digits.slice(2);
    if (afterFirst20.startsWith('201') || afterFirst20.startsWith('2001')) {
      digits = afterFirst20;
    }
  }

  // 2. Specific Egyptian Number Normalization
  // If digits start with 200 (e.g. 2001012345678 -> 201012345678)
  if (digits.startsWith('2001') && digits.length === 13) {
    digits = '20' + digits.slice(3);
    return `+${digits}`;
  }

  // If already starts with 201[0125]xxxxxxxx (12 digits)
  if (/^201[0125]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  // If input was local Egyptian number starting with 01[0125]xxxxxxxx (11 digits)
  if (/^01[0125]\d{8}$/.test(digits)) {
    return `+20${digits.slice(1)}`;
  }

  // If input was 10-digit Egyptian mobile without trunk zero (1[0125]xxxxxxxx) and defaultDial is +20
  if (defaultDialDigits === '20' && /^1[0125]\d{8}$/.test(digits)) {
    return `+20${digits}`;
  }

  // 3. General International Numbers
  if (hasPlus) {
    // UK (+44): +4407... -> +447...
    if (/^440[1-9]\d{8,9}$/.test(digits)) {
      digits = '44' + digits.slice(3);
    }
    // Germany (+49): +4901... -> +491...
    else if (/^490[1-9]\d{8,11}$/.test(digits)) {
      digits = '49' + digits.slice(3);
    }
    // France (+33): +330[1-9]... -> +33[1-9]...
    else if (/^330[1-9]\d{8}$/.test(digits)) {
      digits = '33' + digits.slice(3);
    }
    // Poland (+48): +480... -> +48...
    else if (/^480[1-9]\d{8}$/.test(digits)) {
      digits = '48' + digits.slice(3);
    }
    return `+${digits}`.slice(0, 25);
  }

  // Input did not have leading '+'
  // If digits start with common international prefixes and length looks international
  if (digits.length >= 10 && !digits.startsWith('0')) {
    if (digits.startsWith(defaultDialDigits)) {
      return `+${digits}`.slice(0, 25);
    }
    const knownCountryPrefixes = ['49', '44', '33', '34', '39', '48', '380', '7', '1'];
    const hasKnownPrefix = knownCountryPrefixes.some((p) => digits.startsWith(p));
    if (hasKnownPrefix) {
      return `+${digits}`.slice(0, 25);
    }
  }

  // Domestic number with leading 0 (generic fallback)
  if (digits.startsWith('0')) {
    const national = digits.replace(/^0+/, '');
    return `${cleanDefaultDial}${national}`.slice(0, 25);
  }

  // Otherwise prepend defaultDial
  return `${cleanDefaultDial}${digits}`.slice(0, 25);
}

/**
 * Returns digits-only canonical string for WhatsApp links (no leading '+').
 * E.g. '+201012345678' -> '201012345678'
 */
export function normalizePhoneForWhatsApp(phone: unknown, defaultDial = '+20'): string {
  const canonical = normalizePhoneNumber(phone, defaultDial);
  return canonical.replace(/\D/g, '');
}

/**
 * Builds an official WhatsApp link: https://wa.me/<digits>?text=<encoded_message>
 */
export function buildWhatsAppLink(phone: unknown, message?: string, defaultDial = '+20'): string {
  const digits = normalizePhoneForWhatsApp(phone, defaultDial);
  if (!digits) return '#';
  if (!message) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalizes phone numbers allowing leading +, numbers, spaces, and hyphens.
 * Canonicalizes to E.164 without duplicate trunk zero.
 */
export function sanitizePhone(val: unknown): string {
  if (!val) return '';
  return normalizePhoneNumber(val);
}

/**
 * Generates phone search variants for matching bookings across country codes,
 * local format (e.g. Egypt 01x vs 201x vs +201x), and significant digit suffixes.
 */
export function getPhoneSearchVariants(rawPhone: unknown): string[] {
  if (!rawPhone) return [];
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  if (digits.length < 7) return [];

  const variants = new Set<string>();
  variants.add(digits);
  variants.add(`+${digits}`);

  // Egypt international format: 201xxxxxxxxx (12 digits) -> local 01xxxxxxxxx (11 digits) & suffix 1xxxxxxxxx (10 digits)
  if (digits.startsWith('20') && digits.length >= 11) {
    const local = '0' + digits.slice(2);
    variants.add(local);
    const suffix = digits.slice(2);
    if (suffix.length >= 8) {
      variants.add(suffix);
    }
  }

  // Egypt local format: 01xxxxxxxxx (11 digits) -> international 201xxxxxxxxx & suffix 1xxxxxxxxx
  if (digits.startsWith('0') && digits.length >= 10) {
    const withoutZero = digits.slice(1);
    variants.add(withoutZero);
    variants.add(`20${withoutZero}`);
    variants.add(`+20${withoutZero}`);
  }

  // Universal subscriber suffix (last 9 digits for mobile numbers, or last 8)
  if (digits.length >= 9) {
    variants.add(digits.slice(-9));
  } else if (digits.length >= 8) {
    variants.add(digits.slice(-8));
  }

  return Array.from(variants);
}

/**
 * Recursively sanitizes a JSON object or array.
 */
export function sanitizeDeep<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeText(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeep(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = sanitizeDeep(value);
    }
    return result as T;
  }
  return input;
}
