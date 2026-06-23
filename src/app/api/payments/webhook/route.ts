import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymobEnv } from '@/lib/env';
import { timingSafeEqual, createHmac } from 'crypto';
import type { WebhookPayload, PaymentGatewayLog, WebhookResponse } from '@/types/payment';

function computeHmac(obj: Record<string, unknown>, secret: string): string {
  const keys = Object.keys(obj).sort();
  const concat = keys.map((k) => `${k}=${obj[k]}`).join('&');

  return createHmac('sha256', secret).update(concat).digest('hex');
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  try {
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
