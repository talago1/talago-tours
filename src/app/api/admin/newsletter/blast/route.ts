import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Rate-limiter: max 1 blast every 10 minutes (in-memory per instance).
let lastBlastAt = 0;
const COOLDOWN_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  if (now - lastBlastAt < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (now - lastBlastAt)) / 1000);
    return NextResponse.json(
      { error: `Newsletter blast cooldown active. Retry in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let subject: string;
  let htmlBody: string;
  let promoCode: string | undefined;
  let promoDiscount: string | undefined;

  try {
    const body = await request.json();
    subject = (body.subject as string)?.trim();
    htmlBody = (body.html as string)?.trim();
    promoCode = (body.promoCode as string | undefined)?.trim().toUpperCase() || undefined;
    promoDiscount = (body.promoDiscount as string | undefined)?.trim() || undefined;

    if (!subject || subject.length < 4) {
      return NextResponse.json({ error: 'Subject is required (min 4 chars)' }, { status: 422 });
    }
    if (!htmlBody || htmlBody.length < 20) {
      return NextResponse.json({ error: 'Email body is required (min 20 chars)' }, { status: 422 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Fetch all active subscribers
  const subscribers = await prisma.newsletterSubscription.findMany({
    where: { isActive: true },
    select: { email: true },
  });

  if (subscribers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, message: 'No active subscribers found.' });
  }

  lastBlastAt = Date.now();

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com';
  const promoSection = promoCode
    ? `
      <div style="margin:28px 0;text-align:center;">
        <div style="display:inline-block;padding:20px 36px;background:linear-gradient(135deg,#0ea5e9,#06b6d4);border-radius:16px;">
          <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Your Exclusive Promo Code</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#fff;letter-spacing:0.15em;font-family:monospace;">${promoCode}</p>
          ${promoDiscount ? `<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);font-weight:700;">${promoDiscount}</p>` : ''}
        </div>
      </div>
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${SITE_URL}/tours?promo=${encodeURIComponent(promoCode)}"
           style="display:inline-block;padding:14px 32px;background:#f59e0b;color:#070F1E;text-decoration:none;border-radius:12px;font-weight:900;font-size:15px;letter-spacing:0.05em;">
          Browse Tours &amp; Apply Code →
        </a>
      </p>`
    : `
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${SITE_URL}/tours"
           style="display:inline-block;padding:14px 32px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
          Explore Tours →
        </a>
      </p>`;

  const wrappedHtml = (email: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}" style="text-decoration:none;">
        <span style="font-size:26px;font-weight:900;letter-spacing:0.12em;color:#06b6d4;">TALAGO</span>
        <span style="font-size:14px;color:rgba(255,255,255,0.4);margin-left:6px;vertical-align:middle;">EXPERIENCES</span>
      </a>
    </div>

    <!-- Card -->
    <div style="background:#0f172a;border-radius:20px;border:1px solid rgba(255,255,255,0.08);padding:36px 32px;color:#e2e8f0;">
      ${htmlBody}
      ${promoSection}
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.7;">
      <p style="margin:0 0 8px;">© 2016 TALAGO Experiences Ltd. All rights reserved.</p>
      <p style="margin:0;">
        You're receiving this because you subscribed at talago.com.
        <a href="${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}"
           style="color:#0ea5e9;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send in batches of 10 to avoid rate limits
  const BATCH = 10;
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async ({ email }) => {
        try {
          await sendEmail({ to: email, subject, html: wrappedHtml(email) });
          sent++;
        } catch (err) {
          failed++;
          errors.push(`${email}: ${err instanceof Error ? err.message : 'send error'}`);
        }
      })
    );
    // Small delay between batches to stay within Resend's rate limits
    if (i + BATCH < subscribers.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return NextResponse.json({
    sent,
    failed,
    total: subscribers.length,
    errors: errors.slice(0, 10), // cap error list for readability
  });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const count = await prisma.newsletterSubscription.count({ where: { isActive: true } });
  return NextResponse.json({ activeSubscribers: count });
}
