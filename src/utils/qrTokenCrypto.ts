import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.QR_HMAC_SECRET;
  if (!secret) {
    throw new Error('Missing QR_HMAC_SECRET environment variable');
  }
  return secret;
}

export function generateToken(bookingId: string): string {
  const secret = getSecret();
  const timestamp = Date.now();
  const payload = `${bookingId}:${timestamp}`;
  const hmac = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export function verifyToken(token: string): { bookingId: string; timestamp: number } | null {
  try {
    const secret = getSecret();
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [bookingId, timestampStr, hmac] = parts;
    const expected = createHmac('sha256', secret)
      .update(`${bookingId}:${timestampStr}`)
      .digest('hex');
    if (!timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return null;
    if (Date.now() - timestamp > TOKEN_VALIDITY_MS) return null;
    return { bookingId, timestamp };
  } catch {
    return null;
  }
}
