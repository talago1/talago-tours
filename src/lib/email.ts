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

// ---------------------------------------------------------------------------
// Magic Link / OTP email
// ---------------------------------------------------------------------------

export async function sendMagicLinkEmail(to: string, magicLink: string): Promise<void> {
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your Talago Tours sign-in link',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:8px;">
        <h2 style="color:#1a1a1a;margin-bottom:16px;">Sign in to Talago Tours</h2>
        <p style="color:#444;line-height:1.6;">
          Click the button below to sign in. This link will expire in 60 minutes and can only be used once.
        </p>
        <a href="${magicLink}"
           style="display:inline-block;margin:24px 0;padding:14px 28px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Sign In
        </a>
        <p style="color:#888;font-size:13px;">
          If you didn't request this email, you can safely ignore it.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">TALAGO · Global Tours, Activities & Experiences</p>
      </div>
    `,
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
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Confirmed — ${data.tourName} (${data.bookingReference})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:8px;">
        <h2 style="color:#1a1a1a;">Your booking is confirmed! 🎉</h2>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#888;width:40%;">Tour</td><td style="padding:8px 0;font-weight:600;">${data.tourName}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Reference</td><td style="padding:8px 0;font-weight:600;">${data.bookingReference}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Travel Date</td><td style="padding:8px 0;font-weight:600;">${data.travelDate}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Guests</td><td style="padding:8px 0;font-weight:600;">${data.guestCount}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Total</td><td style="padding:8px 0;font-weight:600;">$${data.totalPriceUSD.toFixed(2)}</td></tr>
        </table>
        <a href="${data.confirmationUrl}"
           style="display:inline-block;margin:16px 0;padding:14px 28px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          View Booking Details
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">TALAGO · Global Tours, Activities & Experiences</p>
      </div>
    `,
  });
  if (error) {
    throw new Error(`Resend booking-confirmation email failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Generic helper — used by the magic-link API route
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
