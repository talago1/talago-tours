import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymobEnv } from '@/lib/env';
import { timingSafeEqual, createHmac } from 'crypto';
import type { WebhookPayload, PaymentGatewayLog, WebhookResponse } from '@/types/payment';

// Paymob HMAC specification: these fields must appear in exactly this order.
// See: https://developers.paymob.com/egypt/hmac-calculation
const PAYMOB_HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

function resolveField(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let value: unknown = obj;
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }
  if (value === undefined || value === null) return '';
  return String(value);
}

function computeHmac(obj: Record<string, unknown>, secret: string): string {
  const concat = PAYMOB_HMAC_FIELDS
    .map((field) => resolveField(obj, field))
    .join('');
  return createHmac('sha256', secret).update(concat).digest('hex');
}

function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return timingSafeEqual(bufA, bufB) && a.length === b.length;
  } catch {
    return false;
  }
}

function buildLog(webhook: WebhookPayload, hmacValidated: boolean): PaymentGatewayLog {
  return {
    transactionId: webhook.obj.id,
    amountCents: webhook.obj.amount_cents,
    currency: webhook.obj.currency,
    success: webhook.obj.success,
    pending: webhook.obj.pending,
    merchantOrderId: webhook.obj.order.merchant_order_id,
    hmacValidated,
    timestamp: new Date().toISOString(),
    rawResponse: webhook,
  };
}

export async function POST(request: NextRequest) {
  try {
    verifyPaymobEnv();
  } catch {
    return NextResponse.json(
      { error: 'Payment gateway not configured' },
      { status: 500 }
    );
  }

  try {
    const body: WebhookPayload = await request.json();
    const { PAYMOB_HMAC_SECRET } = verifyPaymobEnv();

    const computedHmac = computeHmac(body.obj as Record<string, unknown>, PAYMOB_HMAC_SECRET);
    const hmacValid = constantTimeCompare(computedHmac, body.hmac);

    if (!hmacValid) {
      return NextResponse.json(
        { error: 'Invalid HMAC signature' },
        { status: 401 }
      );
    }

    const merchantOrderId = body.obj.order.merchant_order_id;

    const booking = await prisma.booking.findUnique({
      where: { bookingReference: merchantOrderId },
      include: { tour: { select: { translations: true, slug: true } } },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const logEntry = buildLog(body, true);

    if (body.obj.success) {
      // Atomic update: only succeeds if booking hasn't been paid yet.
      // This prevents double-processing from concurrent webhook calls.
      const { count } = await prisma.booking.updateMany({
        where: {
          id: booking.id,
          paymentStatus: { not: 'PAID' },
        },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paymentGatewayLogs: [
            ...(Array.isArray(booking.paymentGatewayLogs) ? booking.paymentGatewayLogs : []),
            logEntry,
          ] as any,
        },
      });

      if (count === 0) {
        return NextResponse.json({
          status: 'ignored',
          reason: 'Booking already paid',
        } satisfies WebhookResponse);
      }

      await prisma.bookingLead.updateMany({
        where: { bookingId: booking.id, status: { not: 'CONVERTED' } },
        data: { status: 'CONVERTED' },
      });

      // Send branded booking confirmation email (non-fatal)
      if (booking.customerEmail && (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY)) {
        try {
          const { sendBookingConfirmationEmail } = await import('@/lib/email');
          const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com';
          const tourTranslations = booking.tour?.translations as Record<string, { title?: string }> | null;
          const tourName =
            (tourTranslations && (tourTranslations[booking.language]?.title || tourTranslations.en?.title)) ||
            booking.tour?.slug ||
            'Your Tour';

          await sendBookingConfirmationEmail(booking.customerEmail, {
            customerName: booking.customerName,
            tourName,
            bookingReference: booking.bookingReference,
            travelDate: booking.travelDate.toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            }),
            guestCount: booking.guestCount,
            totalPriceUSD: booking.totalPriceUSD,
            confirmationUrl: `${SITE_URL}/booking/${booking.accessToken}`,
          });
        } catch (emailErr) {
          console.warn('[webhook] Confirmation email non-fatal error:', emailErr);
        }
      }

      return NextResponse.json({
        status: 'accepted',
        bookingReference: merchantOrderId,
        paymentStatus: 'PAID',
      } satisfies WebhookResponse);
    }

    // Failed payment — log but don't change status if already paid
    await prisma.booking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: { not: 'PAID' },
      },
      data: {
        paymentStatus: 'FAILED',
        paymentGatewayLogs: [
          ...(Array.isArray(booking.paymentGatewayLogs) ? booking.paymentGatewayLogs : []),
          logEntry,
        ] as any,
      },
    });

    return NextResponse.json({
      status: 'failed',
      bookingReference: merchantOrderId,
      paymentStatus: 'FAILED',
    } satisfies WebhookResponse);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
