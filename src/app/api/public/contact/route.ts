import { NextRequest, NextResponse } from 'next/server';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

// 5 contact form submissions per IP per 10 minutes
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

const CONTACT_RECIPIENT =
  process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL || 'info@talago.com';

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'contact-form'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 },
      );
    }

    // Sanitize inputs — strip control characters and truncate
    const safeName = String(name).trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 200);
    const safeEmail = String(email).trim().toLowerCase().slice(0, 254);
    const safeMessage = String(message).trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 2000);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(safeEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    // Send via Resend if API key is configured; otherwise log only (graceful degradation)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: CONTACT_RECIPIENT,
        subject: `Contact Form — ${safeName} <${safeEmail}>`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:8px;">
            <h2 style="color:#1a1a1a;margin-bottom:16px;">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:6px 0;color:#888;width:30%;">Name</td><td style="padding:6px 0;font-weight:600;">${safeName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;font-weight:600;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
            </table>
            <h3 style="color:#555;margin-bottom:8px;">Message</h3>
            <div style="background:#f9f9f9;border-radius:6px;padding:16px;white-space:pre-wrap;color:#333;">${safeMessage}</div>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#aaa;font-size:12px;">Talago Tours · Egypt</p>
          </div>
        `,
      });
    } else {
      // Fallback: log to console — visible in Vercel/server logs
      console.log('[contact-form] submission (no RESEND_API_KEY):', {
        name: safeName,
        email: safeEmail,
        message: safeMessage,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. Our concierge team will respond within 24 hours.',
    });
  } catch (err) {
    console.error('[contact-form] error:', err);
    return NextResponse.json(
      { error: 'Failed to process your message' },
      { status: 500 },
    );
  }
}
