/**
 * Email utility using Resend.
 * All email sending is server-side only — this file must never be imported by
 * client components (no 'use client' directive should ever be added here).
 *
 * Required env var: RESEND_API_KEY
 * Optional env var: RESEND_FROM_EMAIL  (defaults to onboarding@resend.dev for testing,
 *                                       use your verified domain in production)
 */

import { Resend } from 'resend';

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
  const resend = getResendClient();
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your TALAGO sign-in link',
    html,
  });
  if (error) {
    throw new Error(`Resend magic-link email failed: ${error.message}`);
  }
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
  const resend = getResendClient();
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Confirmed — ${data.tourName} (${data.bookingReference})`,
    html,
  });
  if (error) {
    throw new Error(`Resend booking-confirmation email failed: ${error.message}`);
  }
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
  const resend = getResendClient();
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

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `TALAGO replied to your ${isInquiry ? 'inquiry' : 'reservation'} (${data.reference})`,
    html,
  });
  if (error) {
    throw new Error(`Resend admin-reply email failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Generic helper — used by the magic-link API route and newsletter blast
// ---------------------------------------------------------------------------

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }
}
