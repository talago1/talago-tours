/**
 * Strict phone identity for booking ownership.
 * Egyptian local (01…) and international (20… / +20…) forms collapse to the
 * same national number. Short suffixes are never treated as a match.
 */

export function phoneDigits(raw: unknown): string {
  return String(raw ?? '').replace(/\D/g, '');
}

export function phoneMatchKey(raw: unknown): string | null {
  let digits = phoneDigits(raw);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length < 8 || digits.length > 15) return null;

  // Egypt international: 20 + 10-digit national, sometimes written with a trunk 0.
  if (digits.startsWith('20') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = digits.slice(1);
  }

  if (digits.length < 8 || digits.length > 12) return null;
  return digits;
}

export function phonesEquivalent(a: unknown, b: unknown): boolean {
  const left = phoneMatchKey(a);
  const right = phoneMatchKey(b);
  return Boolean(left && right && left === right);
}

export function collectPhoneKeys(values: Array<unknown>): string[] {
  const keys = new Set<string>();
  for (const value of values) {
    const key = phoneMatchKey(value);
    if (key) keys.add(key);
  }
  return [...keys];
}

/** Full stored forms that represent one national number. No short fragments. */
export function exactPhoneVariants(raw: unknown): string[] {
  const key = phoneMatchKey(raw);
  const digits = phoneDigits(raw);
  const variants = new Set<string>();
  if (digits.length >= 8 && digits.length <= 15) {
    variants.add(digits);
    variants.add(`+${digits}`);
  }
  if (key) {
    variants.add(key);
    variants.add(`0${key}`);
    variants.add(`20${key}`);
    variants.add(`+${key}`);
    variants.add(`+20${key}`);
    variants.add(`+0${key}`);
  }
  return [...variants];
}

/**
 * Validates an international E.164 phone number with country-aware length rules.
 * Returns null if valid, or a short validation key/message if invalid.
 */
export function validateInternationalPhone(raw: unknown, countryCode?: string): string | null {
  const str = String(raw ?? '').trim();
  if (!str) return 'Phone number is required';
  const digits = phoneDigits(str);
  if (digits.length < 8 || digits.length > 15) {
    return 'Please enter a valid international phone number (8–15 digits)';
  }
  if (!str.startsWith('+') && !str.startsWith('00')) {
    return 'Phone number must include a valid country calling code';
  }
  if (countryCode === 'EG' || str.startsWith('+20')) {
    const national = digits.startsWith('20') ? digits.slice(2).replace(/^0+/, '') : digits;
    if (!/^1[0125]\d{8}$/.test(national)) {
      return 'Egyptian mobile numbers must be 10 digits (e.g. 010 1234 5678)';
    }
  }
  return null;
}
