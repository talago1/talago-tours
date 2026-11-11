import { createHmac, timingSafeEqual } from 'crypto';

interface ReviewTokenPayload {
  bId: string; // bookingId
  tId: string; // tourId
  exp: number; // Unix timestamp in seconds
}

function getReviewSecret(): string {
  return (
    process.env.REVIEW_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.CRON_SECRET ||
    'talago-review-token-salt-default-key-32b'
  );
}

/**
 * Generates a scoped, tamper-proof review token for a verified booking.
 * Exposes NO access to booking details, payment data, or cancellation capabilities.
 * Valid for 60 days by default.
 */
export function generateReviewToken(params: {
  bookingId: string;
  tourId: string;
  expiresInDays?: number;
}): string {
  const expiresInDays = params.expiresInDays ?? 60;
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;

  const payload: ReviewTokenPayload = {
    bId: params.bookingId,
    tId: params.tourId,
    exp,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getReviewSecret();
  const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Validates and decodes a review token.
 * Returns { bookingId, tourId } if valid and unexpired; otherwise null.
 */
export function verifyReviewToken(
  token: unknown,
): { bookingId: string; tourId: string } | null {
  if (typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return null;
  }

  const secret = getReviewSecret();
  const expectedSignature = createHmac('sha256', secret).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr) as ReviewTokenPayload;

    if (!payload.bId || !payload.tId || typeof payload.exp !== 'number') {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > payload.exp) {
      return null; // Expired token
    }

    return {
      bookingId: payload.bId,
      tourId: payload.tId,
    };
  } catch {
    return null;
  }
}

