import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/utils/adminAuth';
import { normalizePhoneNumber } from '@/utils/sanitize';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://talago-tours.com';
}

function getGreenApiConfig(): { instanceId: string; token: string } | null {
  const instanceId = process.env.GREEN_API_ID;
  const token = process.env.GREEN_API_TOKEN;
  if (!instanceId || !token) return null;
  return { instanceId, token };
}

async function sendWhatsAppMessage(toPhone: string, message: string): Promise<boolean> {
  const config = getGreenApiConfig();
  if (!config) return false;

  const normalized = normalizePhoneNumber(toPhone).replace('+', '');
  const chatId = `${normalized}@c.us`;

  try {
    const url = `https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[DispatchBroadcast] WhatsApp send exception:', err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tourId, departureDate, driverName, driverPhone, vehicleDetails, pickupNotes } = body;

    if (!tourId || !departureDate || !driverName) {
      return NextResponse.json(
        { error: 'tourId, departureDate, and driverName are required' },
        { status: 400 }
      );
    }

    const startOfDay = new Date(departureDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(departureDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        tourId,
        travelDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: {
        tour: { select: { id: true, slug: true, translations: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        dispatchedCount: 0,
        message: 'No confirmed guests found for this departure date.',
      });
    }

    const baseUrl = getBaseUrl();
    let sentCount = 0;
    const errors: string[] = [];

    for (const b of bookings) {
      const tourTranslations = (b.tour?.translations ?? null) as Record<string, { title?: string }> | null;
      const tourTitle =
        tourTranslations?.[b.language]?.title ||
        tourTranslations?.en?.title ||
        b.tourTitleSnapshot ||
        'Tour Experience';

      const voucherUrl = `${baseUrl}/tours/voucher/${b.accessToken}`;
      const pickupTime = b.selectedPickupTime || 'TBD (Our driver will meet you in the lobby)';
      const hotel = b.hotelName || b.pickupLocationName || 'Hotel Lobby / Meeting Point';

      const messageText = `🚐 *TALAGO — Driver & Transfer Details*

Hello ${b.customerName}! 🎉

Your transfer logistics for *${tourTitle}* on *${departureDate}* have been confirmed:

👤 *Driver:* ${driverName}
📞 *Driver Contact / WhatsApp:* ${driverPhone || '+20 122 243 4602'}
🚗 *Vehicle:* ${vehicleDetails || 'Talago VIP Transfer'}
⏰ *Scheduled Pickup Time:* ${pickupTime}
🏨 *Location:* ${hotel}
${b.roomNumber ? `🔑 *Room:* ${b.roomNumber}\n` : ''}${pickupNotes ? `ℹ️ *Notes:* ${pickupNotes}\n` : ''}
🔗 *Live Boarding Pass & Concierge:*
${voucherUrl}

Emergency 24/7 Concierge: +20 122 243 4602
We wish you an unforgettable adventure! 🌅
— Talago Operations Team`;

      let waSent = false;
      if (b.customerPhone) {
        waSent = await sendWhatsAppMessage(b.customerPhone, messageText);
        if (waSent) {
          await prisma.notificationLog.create({
            data: {
              bookingId: b.id,
              channel: 'DRIVER_DISPATCH_WHATSAPP',
              recipient: b.customerPhone,
              status: 'SENT',
            },
          }).catch(() => {});
        }
      }

      let emailSent = false;
      if (b.customerEmail && !b.customerEmail.endsWith('@noreply.talago.com')) {
        try {
          await sendEmail({
            to: b.customerEmail,
            subject: `Driver & Transfer Details: ${tourTitle} (${departureDate})`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #070F1E; color: #F8FAFC; border-radius: 16px;">
                <h2 style="color: #00E5FF; margin-top: 0;">Driver &amp; Transfer Details</h2>
                <p>Hello <strong>${b.customerName}</strong>,</p>
                <p>Your transfer logistics for <strong>${tourTitle}</strong> on <strong>${departureDate}</strong> have been confirmed:</p>
                <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
                  <p style="margin: 6px 0;"><strong>Driver:</strong> ${driverName}</p>
                  <p style="margin: 6px 0;"><strong>Driver Contact:</strong> ${driverPhone || '+20 122 243 4602'}</p>
                  <p style="margin: 6px 0;"><strong>Vehicle:</strong> ${vehicleDetails || 'Talago VIP Transfer'}</p>
                  <p style="margin: 6px 0;"><strong>Pickup Time:</strong> <span style="color: #EAB308; font-weight: bold;">${pickupTime}</span></p>
                  <p style="margin: 6px 0;"><strong>Hotel / Meeting Location:</strong> ${hotel}</p>
                  ${pickupNotes ? `<p style="margin: 6px 0;"><strong>Notes:</strong> ${pickupNotes}</p>` : ''}
                </div>
                <p style="text-align: center; margin: 24px 0;">
                  <a href="${voucherUrl}" style="background: #00E5FF; color: #070F1E; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">View Live Boarding Pass</a>
                </p>
                <p style="font-size: 12px; color: #94A3B8;">24/7 Operations Support: +20 122 243 4602</p>
              </div>
            `,
          });
          emailSent = true;
          await prisma.notificationLog.create({
            data: {
              bookingId: b.id,
              channel: 'DRIVER_DISPATCH_EMAIL',
              recipient: b.customerEmail,
              status: 'SENT',
            },
          }).catch(() => {});
        } catch (e: any) {
          errors.push(`Email error for ${b.bookingReference}: ${e.message}`);
        }
      }

      if (waSent || emailSent) {
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalGuests: bookings.length,
      dispatchedCount: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('[DispatchBroadcast] Fatal:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
