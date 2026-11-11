import { prisma } from '@/lib/prisma';
import { parseSettingValue, DEFAULT_SETTINGS } from '@/lib/systemSettings';
import { generateReviewToken } from '@/utils/reviewToken';

async function getNotificationSettings() {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: 'notifications' },
    });
    if (!row) return DEFAULT_SETTINGS.notifications;
    return parseSettingValue(row.value, DEFAULT_SETTINGS.notifications);
  } catch {
    return DEFAULT_SETTINGS.notifications;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingNotificationPayload {
  bookingId: string;
  bookingReference: string;
  accessToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  tourTitle: string;
  travelDate: string;
  hotelName: string;
  guestCount: number;
  totalPriceUSD: number;
  pickupTime?: string | null;
  language: string;
  currency?: string;
  status: string;
  whatsappOptIn: boolean;
  pdfUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://talago.com';
}

function sanitizePhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
}

// ---------------------------------------------------------------------------
// Message builder
// ---------------------------------------------------------------------------

function buildCustomerWhatsAppMessage(data: BookingNotificationPayload): string {
  const baseUrl = getBaseUrl();
  const isSyntheticEmail = data.customerEmail.endsWith('@noreply.talago.com');
  const manageLink = isSyntheticEmail
    ? `${baseUrl}/booking/${data.accessToken}`
    : `${baseUrl}/auth?email=${encodeURIComponent(data.customerEmail)}`;
  const curr = (data.currency || 'USD').toUpperCase();
  const currSymbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'EGP' ? 'EGP ' : '$';
  const pickupLine = data.pickupTime ? `\n🚐 *Pickup Time:* ${data.pickupTime}` : '';
  const boardingPassLine = data.pdfUrl
    ? `🎫 *Your Boarding Pass (PDF):*\n${data.pdfUrl}\n`
    : `🎫 *Your Boarding Pass:*\n${baseUrl}/booking/${data.accessToken}\n`;

  return `🌊 *TALAGO — Booking Confirmation*

Hello ${data.customerName}! 🎉

Your booking *#${data.bookingReference}* is now *${data.status}*.

🗺️ *Experience:* ${data.tourTitle}
📅 *Date:* ${data.travelDate}
👥 *Guests:* ${data.guestCount}
🏨 *Hotel / Meeting Point:* ${data.hotelName}${pickupLine}
💰 *Total:* ${currSymbol}${data.totalPriceUSD.toFixed(2)}

${boardingPassLine}
🔗 *View & Manage Reservation:*
${manageLink}

Need anything or have a question? Reply to this message or WhatsApp us at +20 122 243 4602.
See you on your adventure! 🌅
— Talago Team`;
}

function buildAdminTelegramMessage(data: BookingNotificationPayload): string {
  const baseUrl = getBaseUrl();
  const curr = (data.currency || 'USD').toUpperCase();
  const currSymbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'EGP' ? 'EGP ' : '$';
  const pickupLine = data.pickupTime ? `\n🚐 *Pickup:* ${data.pickupTime}` : '';
  return `📋 *NEW BOOKING ALERT*

*Ref:* #${data.bookingReference}
*Customer:* ${data.customerName}
*Phone:* ${data.customerPhone}
*Email:* ${data.customerEmail}
*Tour:* ${data.tourTitle}
*Date:* ${data.travelDate}
*Guests:* ${data.guestCount}
*Hotel:* ${data.hotelName}${pickupLine}
*Total:* ${currSymbol}${data.totalPriceUSD.toFixed(2)} (${curr})
*Status:* ${data.status}
*WhatsApp Opt-In:* ${data.whatsappOptIn ? '✅ Yes' : '❌ No'}

🔗 [Open Admin Dashboard](${baseUrl}/admin/bookings)`;
}

// ---------------------------------------------------------------------------
// Channel 1: WhatsApp via Green-API
// ---------------------------------------------------------------------------

async function sendWhatsApp(
  data: BookingNotificationPayload,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const instanceId = process.env.GREEN_API_ID;
  const token = process.env.GREEN_API_TOKEN;
  if (!instanceId || !token) {
    return { success: false, error: 'GREEN-API credentials not configured' };
  }

  const chatId = `${sanitizePhoneForWhatsApp(data.customerPhone)}@c.us`;
  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GREEN-API HTTP ${res.status}: ${errText}` };
    }
    const result = (await res.json()) as { idMessage: string };
    return { success: true, messageId: result.idMessage };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Green-API error' };
  }
}

// ---------------------------------------------------------------------------
// Channel 2: Telegram via Bot API
// ---------------------------------------------------------------------------

async function sendTelegram(
  data: BookingNotificationPayload,
  adminMessage: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram credentials not configured' };
  }

  const telegramApiBase = `https://api.telegram.org/bot${botToken}`;

  try {
    const msgRes = await fetch(`${telegramApiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: adminMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!msgRes.ok) {
      const errText = await msgRes.text();
      return { success: false, error: `Telegram HTTP ${msgRes.status}: ${errText}` };
    }

    const msgResult = (await msgRes.json()) as { ok: boolean; result?: { message_id: number } };

    // Also send Boarding Pass PDF document to Admin if available
    if (data.pdfUrl) {
      await fetch(`${telegramApiBase}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          document: data.pdfUrl,
          caption: `🎫 Boarding Pass #${data.bookingReference} — ${data.customerName}`,
        }),
      }).catch(() => { /* non-fatal */ });
    }

    return {
      success: msgResult.ok,
      messageId: msgResult.result?.message_id ? String(msgResult.result.message_id) : undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Telegram error' };
  }
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

async function logNotification(
  bookingId: string,
  channel: string,
  recipient: string,
  result: { success: boolean; messageId?: string; error?: string },
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel,
        recipient,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error ?? null,
        messageId: result.messageId ?? null,
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`[notificationDispatcher] Failed to log ${channel} notification:`, err);
  }
}

// ---------------------------------------------------------------------------
// Public API — Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Sends WhatsApp + Telegram notifications after a booking is confirmed.
 * Called fire-and-forget — never throws, never blocks the HTTP response.
 */
export async function dispatchBookingNotifications(
  bookingId: string,
  pdfUrl?: string,
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: { select: { translations: true } } },
    });

    if (!booking) {
      console.error(`[notificationDispatcher] Booking ${bookingId} not found`);
      return;
    }

    const translations = booking.tour.translations as Record<string, { title?: string }> | null;
    const tourTitle =
      translations?.[booking.language]?.title ??
      translations?.en?.title ??
      'Talago Experience';

    const travelDateFormatted = booking.travelDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const payload: BookingNotificationPayload = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      accessToken: booking.accessToken,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      tourTitle,
      travelDate: travelDateFormatted,
      hotelName: booking.hotelName ?? booking.pickupLocationName ?? '',
      guestCount: booking.guestCount,
      totalPriceUSD: booking.totalPriceUSD,
      currency: booking.currency || 'USD',
      pickupTime: booking.selectedPickupTime,
      language: booking.language,
      status: booking.status,
      whatsappOptIn: booking.whatsappOptIn ?? true,
      pdfUrl: pdfUrl ?? booking.pdfBoardingPassUrl ?? undefined,
    };

    const notifSettings = await getNotificationSettings();

    // 1. WhatsApp to customer (if opted in and channel enabled)
    if (payload.whatsappOptIn && notifSettings.whatsapp?.enabled && notifSettings.whatsapp?.events?.newBooking !== false) {
      const waMessage = buildCustomerWhatsAppMessage(payload);
      const waResult = await sendWhatsApp(payload, waMessage);
      await logNotification(bookingId, 'WHATSAPP', booking.customerPhone, waResult);
      if (!waResult.success) {
        console.warn(`[notificationDispatcher] WhatsApp failed for ${booking.customerPhone}:`, waResult.error);
      }
    }

    // 2. Telegram alert to Admin (if channel and newBooking event enabled)
    if (notifSettings.telegram?.enabled && notifSettings.telegram?.events?.newBooking !== false) {
      const adminMessage = buildAdminTelegramMessage(payload);
      const tgResult = await sendTelegram(payload, adminMessage);
      await logNotification(
        bookingId,
        'TELEGRAM',
        process.env.TELEGRAM_ADMIN_CHAT_ID ?? 'admin',
        tgResult,
      );
      if (!tgResult.success) {
        console.warn(`[notificationDispatcher] Telegram failed for admin:`, tgResult.error);
      }
    }

    // 3. Email to customer (if channel and newBooking event enabled)
    if (notifSettings.email?.enabled && notifSettings.email?.events?.newBooking) {
      if (booking.customerEmail && !booking.customerEmail.endsWith('@noreply.talago.com')) {
        try {
          const { sendBookingConfirmationEmail } = await import('@/lib/email');
          await sendBookingConfirmationEmail(booking.customerEmail, {
            customerName: booking.customerName,
            bookingReference: booking.bookingReference,
            tourName: tourTitle,
            travelDate: travelDateFormatted,
            guestCount: booking.guestCount,
            totalPriceUSD: booking.totalPriceUSD,
            confirmationUrl: `${getBaseUrl()}/booking/${booking.accessToken}`,
          });
          await logNotification(bookingId, 'EMAIL', booking.customerEmail, { success: true });
        } catch (emailErr: any) {
          console.warn('[notificationDispatcher] Confirmation email error:', emailErr);
          await logNotification(bookingId, 'EMAIL', booking.customerEmail, { success: false, error: emailErr?.message });
        }
      }
    }
  } catch (err) {
    console.error('[notificationDispatcher] Dispatch error:', err);
  }
}

/**
 * Dispatches notifications when a booking status changes.
 */
export async function dispatchStatusChangeNotifications(
  bookingId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: { select: { translations: true } } },
    });
    if (!booking) return;

    const notifSettings = await getNotificationSettings();

    // 1. In-site / NotificationLog
    if (notifSettings.inSite?.enabled && notifSettings.inSite?.events?.statusChange !== false) {
      await logNotification(bookingId, 'SYSTEM', 'admin', {
        success: true,
        messageId: `STATUS_${oldStatus}_TO_${newStatus}`,
      });
    }

    const translations = booking.tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = translations?.[booking.language]?.title ?? translations?.en?.title ?? 'Talago Experience';
    const baseUrl = getBaseUrl();

    // 2. Telegram Alert to Admin
    if (notifSettings.telegram?.enabled && notifSettings.telegram?.events?.statusChange !== false) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (botToken && chatId) {
        const text = `🔄 *BOOKING STATUS UPDATED*

*Ref:* #${booking.bookingReference}
*Customer:* ${booking.customerName} (${booking.customerPhone})
*Tour:* ${tourTitle}
*Status Transition:* ${oldStatus} ➔ *${newStatus}*

🔗 [View in Admin](${baseUrl}/admin/bookings)`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
        }).catch(() => {});
      }
    }

    // 3. Customer WhatsApp notification on status change
    if (booking.whatsappOptIn && notifSettings.whatsapp?.enabled && notifSettings.whatsapp?.events?.statusChange) {
      const instanceId = process.env.GREEN_API_ID;
      const token = process.env.GREEN_API_TOKEN;
      if (instanceId && token && booking.customerPhone) {
        const phoneChatId = `${sanitizePhoneForWhatsApp(booking.customerPhone)}@c.us`;
        const waMsg = `🌊 *TALAGO — Booking Update*

Hello ${booking.customerName},
The status of your booking *#${booking.bookingReference}* (${tourTitle}) has been updated to: *${newStatus}*.

🔗 View details & boarding pass:
${baseUrl}/booking/${booking.accessToken}

Need assistance? Reply directly to this WhatsApp message.
— Talago Team`;

        const waUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
        await fetch(waUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: phoneChatId, message: waMsg }),
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[notificationDispatcher] Status change dispatch error:', err);
  }
}

// ---------------------------------------------------------------------------
// Abandoned checkout follow-up dispatcher
// ---------------------------------------------------------------------------

/**
 * Sends a WhatsApp reminder + Telegram alert for an uncompleted checkout.
 * Called by the /api/notifications/abandoned-recovery cron endpoint.
 */
export async function dispatchAbandonedCheckoutReminder(
  abandonedCheckoutId: string,
): Promise<void> {
  try {
    const entry = await prisma.abandonedCheckout.findUnique({
      where: { id: abandonedCheckoutId },
    });

    if (!entry || entry.isRecovered || entry.reminderSent) return;

    const baseUrl = getBaseUrl();
    const tour = await prisma.tour.findUnique({
      where: { id: entry.tourId },
      select: { id: true, slug: true, translations: true },
    });
    const tourTranslations = tour?.translations as Record<string, { title?: string }> | null;
    const tourTitle = tourTranslations?.en?.title || tour?.slug || 'Talago Experience';
    const tourSlug = tour?.slug || entry.tourId;
    const checkoutUrl = `${baseUrl}/checkout/${tour?.id || entry.tourId}`;
    const tourUrl = `${baseUrl}/tours/${tourSlug}`;
    const message = `Hey ${entry.name}! 👋

We noticed you started booking ${tourTitle} but didn't get to finish.

Your spot may still be available — finish your booking now:
${checkoutUrl}

Need help or have questions? WhatsApp us directly at +20 122 243 4602.
— Talago Team 🌊`;

    // Branded email recovery reminder
    if (entry.email && process.env.RESEND_API_KEY) {
      try {
        const { sendAbandonedCheckoutEmail } = await import('@/lib/email');
        await sendAbandonedCheckoutEmail(entry.email, {
          customerName: entry.name,
          tourName: tourTitle,
          checkoutUrl,
          travelDate: entry.travelDate || undefined,
          guestCount: entry.guestCount,
        });
      } catch (emailErr) {
        console.warn('[notificationDispatcher] Abandoned recovery email error:', emailErr);
      }
    }

    // WhatsApp reminder
    const instanceId = process.env.GREEN_API_ID;
    const token = process.env.GREEN_API_TOKEN;
    if (instanceId && token) {
      const chatId = `${sanitizePhoneForWhatsApp(entry.phone)}@c.us`;
      const waUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
      await fetch(waUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      }).catch((err) => {
        console.error('[notificationDispatcher] WhatsApp reminder error:', err);
      });
    }

    // Telegram admin alert
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (botToken && adminChatId) {
      const tgText = `⚠️ *ABANDONED CHECKOUT REMINDER*

*Name:* ${entry.name}
*Phone:* ${entry.phone}
*Email:* ${entry.email ?? 'N/A'}
*Tour ID:* ${entry.tourId}
*Guests:* ${entry.guestCount}
*Travel Date:* ${entry.travelDate ?? 'N/A'}
*Step:* ${entry.step}`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: tgText,
          parse_mode: 'Markdown',
        }),
      }).catch((err) => {
        console.error('[notificationDispatcher] Telegram reminder alert error:', err);
      });
    }

    // Mark reminder as sent
    await prisma.abandonedCheckout.update({
      where: { id: abandonedCheckoutId },
      data: { reminderSent: true, reminderSentAt: new Date() },
    });
  } catch (err) {
    console.error('[notificationDispatcher] Abandoned checkout reminder failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Post-Tour Review Invitation Dispatcher
// ---------------------------------------------------------------------------

/**
 * Sends a post-tour review invitation via WhatsApp and Email for completed excursions.
 */
export async function dispatchPostTourReviewInvitation(
  bookingId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: { select: { id: true, slug: true, translations: true } },
      },
    });

    if (!booking || !booking.tour) {
      return { success: false, error: 'Booking or tour not found' };
    }

    // 1. Enforce WhatsApp Opt-in requirement
    if (!booking.whatsappOptIn) {
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          channel: 'POST_TOUR_REVIEW',
          recipient: booking.customerPhone || booking.customerEmail || 'unknown',
          status: 'SKIPPED',
          errorMessage: 'Customer did not opt in to WhatsApp updates (whatsappOptIn = false)',
        },
      });
      return { success: false, error: 'Customer did not opt in to WhatsApp' };
    }

    // 2. Prevent duplicate invitations
    const existingLog = await prisma.notificationLog.findFirst({
      where: {
        bookingId: booking.id,
        channel: 'POST_TOUR_REVIEW',
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
    });

    if (existingLog) {
      return { success: true };
    }

    if (!booking.customerPhone) {
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          channel: 'POST_TOUR_REVIEW',
          recipient: booking.customerEmail || 'unknown',
          status: 'FAILED',
          errorMessage: 'Customer phone number is missing',
        },
      });
      return { success: false, error: 'Customer phone number missing' };
    }

    const baseUrl = getBaseUrl();
    const tourTranslations = booking.tour.translations as Record<string, { title?: string }> | null;
    const tourTitle =
      tourTranslations?.[booking.language]?.title ||
      tourTranslations?.en?.title ||
      booking.tour.slug;

    // 3. Generate review-specific scoped access token (NO full booking management accessToken exposed)
    const reviewToken = generateReviewToken({
      bookingId: booking.id,
      tourId: booking.tour.id,
    });
    const reviewUrl = `${baseUrl}/reviews/submit?token=${encodeURIComponent(reviewToken)}`;

    // 4. Meta-compliant template structure (talago_tour_review_invitation_v1)
    const waMessage = `Hello ${booking.customerName}! 🌊

We hope you had an unforgettable experience on *${tourTitle}*!

We would love to hear your feedback to help future travelers:
⭐️ Leave a 1-click review:
${reviewUrl}

Thank you for choosing Talago Tours! 🐬

(Reply STOP to opt out of trip updates)`;

    // 5. WhatsApp Invitation via Green-API
    const instanceId = process.env.GREEN_API_ID;
    const token = process.env.GREEN_API_TOKEN;

    if (!instanceId || !token) {
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          channel: 'POST_TOUR_REVIEW',
          recipient: booking.customerPhone,
          status: 'FAILED',
          errorMessage: 'GREEN-API credentials not configured in environment',
        },
      });
      return { success: false, error: 'GREEN-API credentials not configured' };
    }

    const chatId = `${sanitizePhoneForWhatsApp(booking.customerPhone)}@c.us`;
    const waUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

    const res = await fetch(waUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: waMessage }),
    });

    if (!res.ok) {
      const errText = await res.text();
      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          channel: 'POST_TOUR_REVIEW',
          recipient: booking.customerPhone,
          status: 'FAILED',
          errorMessage: `GREEN-API HTTP ${res.status}: ${errText}`,
        },
      });
      return { success: false, error: `GREEN-API HTTP ${res.status}: ${errText}` };
    }

    const result = (await res.json());

    // Record delivery state
    await prisma.notificationLog.create({
      data: {
        bookingId: booking.id,
        channel: 'POST_TOUR_REVIEW',
        recipient: booking.customerPhone,
        status: 'SENT',
        messageId: result.idMessage || null,
      },
    });

    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to dispatch review invite';
    console.error('[notificationDispatcher] Post-tour review invite failed:', err);
    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel: 'POST_TOUR_REVIEW',
        recipient: 'unknown',
        status: 'FAILED',
        errorMessage: errorMsg,
      },
    }).catch(() => {});
    return { success: false, error: errorMsg };
  }
}
