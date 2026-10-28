/**
 * Email utility supporting Resend and Brevo (dual provider).
 * All email sending is server-side only — this file must never be imported by
 * client components (no 'use client' directive should ever be added here).
 *
 * Configured via:
 *   RESEND_API_KEY  (primary)
 *   BREVO_API_KEY   (Brevo v3 provider / fallback)
 *   RESEND_FROM_EMAIL / BREVO_FROM_EMAIL
 */

import { Resend } from 'resend';
import { isBrevoConfigured, sendBrevoTransactionalEmail } from '@/lib/brevo';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Email utility imported into browser bundle.');
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variable: RESEND_API_KEY');
  }
  return new Resend(apiKey);
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'TALAGO <onboarding@resend.dev>';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com';

// ---------------------------------------------------------------------------
// Shared HTML layout
// ---------------------------------------------------------------------------

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}" style="text-decoration:none;">
        <span style="font-size:26px;font-weight:900;letter-spacing:0.12em;color:#06b6d4;">TALAGO</span>
        <span style="font-size:13px;color:rgba(255,255,255,0.35);margin-left:6px;vertical-align:middle;letter-spacing:0.06em;">EXPERIENCES</span>
      </a>
    </div>

    <!-- Card -->
    <div style="background:#0f172a;border-radius:20px;border:1px solid rgba(255,255,255,0.08);padding:36px 32px;color:#e2e8f0;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.8;">
      <p style="margin:0 0 4px;">© 2016 TALAGO Experiences Ltd. All rights reserved.</p>
      <p style="margin:0;">
        <a href="${SITE_URL}" style="color:#0ea5e9;text-decoration:none;">talago.com</a>
        &nbsp;·&nbsp;Global Tours, Activities &amp; Experiences
      </p>
    </div>
  </div>
</body>
</html>`;
}

function primaryBtn(href: string, label: string): string {
  return `<a href="${href}"
     style="display:inline-block;margin:24px 0 8px;padding:14px 32px;background:linear-gradient(135deg,#0ea5e9,#06b6d4);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.03em;">
    ${label}
  </a>`;
}

function tableRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;color:rgba(255,255,255,0.45);font-size:13px;width:38%;vertical-align:top;">${label}</td>
    <td style="padding:9px 0;color:#fff;font-weight:700;font-size:13px;vertical-align:top;">${value}</td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// Magic Link / OTP email
// ---------------------------------------------------------------------------

export async function sendMagicLinkEmail(to: string, magicLink: string): Promise<void> {
  const html = layout(`
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#fff;">Sign in to TALAGO</h2>
    <p style="margin:0 0 20px;color:rgba(255,255,255,0.6);line-height:1.7;font-size:14px;">
      Click the button below to sign in to your account. This link expires in <strong style="color:#fff;">60 minutes</strong> and can only be used once.
    </p>
    ${primaryBtn(magicLink, 'Sign In →')}
    <p style="margin:20px 0 0;color:rgba(255,255,255,0.35);font-size:12px;">
      If you didn't request this email, you can safely ignore it — your account remains secure.
    </p>
  `);

  await sendEmail({
    to,
    subject: 'Your TALAGO sign-in link',
    html,
  });
}

// ---------------------------------------------------------------------------
// Booking confirmation email
// ---------------------------------------------------------------------------

export interface BookingConfirmationData {
  customerName: string;
  tourName: string;
  bookingReference: string;
  travelDate: string;
  guestCount: number;
  totalPriceUSD: number;
  confirmationUrl: string;
}

export async function sendBookingConfirmationEmail(
  to: string,
  data: BookingConfirmationData,
): Promise<void> {
  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;font-size:26px;">✓</div>
    </div>
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;text-align:center;">Booking Confirmed!</h2>
    <p style="margin:0 0 28px;color:rgba(255,255,255,0.5);text-align:center;font-size:14px;">Hi ${data.customerName}, your adventure is locked in.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <tbody>
        ${tableRow('Tour', data.tourName)}
        ${tableRow('Reference', `<span style="font-family:monospace;color:#06b6d4;">${data.bookingReference}</span>`)}
        ${tableRow('Travel Date', data.travelDate)}
        ${tableRow('Guests', String(data.guestCount))}
        ${tableRow('Total Paid', `$${data.totalPriceUSD.toFixed(2)}`)}
      </tbody>
    </table>

    <div style="text-align:center;margin-top:12px;">
      ${primaryBtn(data.confirmationUrl, 'View Booking Details →')}
    </div>

    <div style="margin-top:28px;padding:16px;background:rgba(6,182,212,0.08);border-radius:12px;border:1px solid rgba(6,182,212,0.2);">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;">
        🎒 <strong style="color:#06b6d4;">What's next?</strong> Our team will be in touch with joining instructions closer to your travel date. You can also check your booking status and chat with us anytime via your
        <a href="${SITE_URL}/my-bookings" style="color:#0ea5e9;">My Bookings</a> page.
      </p>
    </div>
  `);

  await sendEmail({
    to,
    subject: `Booking Confirmed — ${data.tourName} (${data.bookingReference})`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Admin reply / lead update email
// ---------------------------------------------------------------------------

export interface AdminReplyEmailData {
  customerName: string;
  reference: string; // RES-... or INQ-...
  tourName?: string;
  adminMessage: string;
  replyUrl: string;
}

export async function sendAdminReplyEmail(
  to: string,
  data: AdminReplyEmailData,
): Promise<void> {
  const isInquiry = data.reference.startsWith('INQ-');
  const refLabel = isInquiry ? 'Inquiry Reference' : 'Reservation Reference';

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#fff;">New message from TALAGO</h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:14px;">Hi ${data.customerName}, the TALAGO team has replied to your ${isInquiry ? 'inquiry' : 'reservation'}.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tbody>
        ${data.tourName ? tableRow('Tour', data.tourName) : ''}
        ${tableRow(refLabel, `<span style="font-family:monospace;color:#06b6d4;">${data.reference}</span>`)}
      </tbody>
    </table>

    <div style="padding:18px;background:rgba(255,255,255,0.04);border-radius:12px;border-left:3px solid #06b6d4;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#06b6d4;">Message from TALAGO</p>
      <p style="margin:0;color:#e2e8f0;line-height:1.8;font-size:14px;white-space:pre-wrap;">${data.adminMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>

    <div style="text-align:center;">
      ${primaryBtn(data.replyUrl, 'View Conversation →')}
    </div>
  `);

  await sendEmail({
    to,
    subject: `TALAGO replied to your ${isInquiry ? 'inquiry' : 'reservation'} (${data.reference})`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Abandoned checkout recovery email
// ---------------------------------------------------------------------------

export interface AbandonedCheckoutEmailData {
  customerName: string;
  tourName: string;
  checkoutUrl: string;
  travelDate?: string;
  guestCount?: number;
}

export async function sendAbandonedCheckoutEmail(
  to: string,
  data: AbandonedCheckoutEmailData,
): Promise<void> {
  const html = layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;padding:6px 14px;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.3);border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#06b6d4;">
        Spot Held For You
      </span>
    </div>

    <h2 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#fff;text-align:center;">
      Did you leave something behind? 🌊
    </h2>
    <p style="margin:0 0 24px;color:rgba(255,255,255,0.65);font-size:14px;line-height:1.7;text-align:center;">
      Hi ${data.customerName}, we noticed you started booking <strong style="color:#fff;">${data.tourName}</strong>, but didn't finish.
      Your spot is held for a limited time — complete your booking now to guarantee your adventure!
    </p>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${tableRow('Tour Experience', data.tourName)}
          ${data.travelDate ? tableRow('Preferred Date', data.travelDate) : ''}
          ${data.guestCount ? tableRow('Guests', String(data.guestCount)) : ''}
        </tbody>
      </table>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      ${primaryBtn(data.checkoutUrl, 'Finish Your Booking Now →')}
    </div>

    <p style="text-align:center;color:rgba(255,255,255,0.35);font-size:12px;margin:0;line-height:1.6;">
      Have special requests or questions? Our concierge team is available 24/7 on WhatsApp.
    </p>
  `);

  await sendEmail({
    to,
    subject: `Did you leave something behind? Your ${data.tourName} experience awaits 🌊`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Generic helper with automatic dual-provider fallback (Resend / Brevo)
// ---------------------------------------------------------------------------

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasBrevo = isBrevoConfigured();

  if (hasResend) {
    try {
      const resend = getResendClient();
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      if (!error) return;
      console.warn('[sendEmail] Resend error:', error.message);
      if (!hasBrevo) {
        throw new Error(`Resend email failed: ${error.message}`);
      }
    } catch (err: any) {
      if (!hasBrevo) throw err;
      console.warn('[sendEmail] Resend failed, attempting fallback to Brevo:', err.message);
    }
  }

  if (hasBrevo) {
    await sendBrevoTransactionalEmail({
      to: options.to,
      subject: options.subject,
      htmlContent: options.html,
    });
    return;
  }

  throw new Error('No email provider configured. Please configure RESEND_API_KEY or BREVO_API_KEY.');
}
