const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 4;

export function generateBookingReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(LENGTH));
  let code = '';
  for (let i = 0; i < LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `TLG-2026-${code}`;
}
