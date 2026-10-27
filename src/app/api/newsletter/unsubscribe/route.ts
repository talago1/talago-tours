import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/newsletter/unsubscribe?email=...
 * One-click unsubscribe — linked from every newsletter footer.
 * Sets isActive = false so the email is retained for audit but not emailed again.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2 style="color:#e11d48;">Invalid unsubscribe link</h2>
        <p>The unsubscribe link appears to be malformed. Please contact support.</p>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const record = await prisma.newsletterSubscription.findUnique({ where: { email } });
    if (record && record.isActive) {
      await prisma.newsletterSubscription.update({
        where: { email },
        data: { isActive: false },
      });
    }
  } catch {
    // Silently fail — still show success to avoid email enumeration
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com';
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Unsubscribed — TALAGO</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;background:#0a0f1e;font-family:'Helvetica Neue',Arial,sans-serif;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;max-width:480px;padding:40px 24px;">
    <div style="font-size:48px;margin-bottom:16px;">✅</div>
    <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#fff;">You've been unsubscribed</h1>
    <p style="margin:0 0 32px;color:rgba(255,255,255,0.5);line-height:1.7;">
      You won't receive marketing emails from TALAGO anymore.<br>
      You can re-subscribe anytime from our website.
    </p>
    <a href="${SITE_URL}" style="display:inline-block;padding:14px 32px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">
      Back to TALAGO
    </a>
  </div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
