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
 * Normalizes phone numbers allowing leading +, numbers, spaces, and hyphens.
 */
export function sanitizePhone(val: unknown): string {
  if (!val) return '';
  const str = String(val).trim();
  const hasPlus = str.startsWith('+');
  const digitsOnly = str.replace(/[^\d]/g, '');
  return `${hasPlus ? '+' : ''}${digitsOnly}`.slice(0, 25);
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
