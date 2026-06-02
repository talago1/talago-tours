import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingNotificationData {
  bookingId: string;
  bookingReference: string;
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
  status: string;
}

interface GreenApiSendResponse {
  idMessage: string;
}

// ---------------------------------------------------------------------------
// GREEN-API Configuration
// ---------------------------------------------------------------------------

function getGreenApiConfig(): { instanceId: string; token: string } | null {
  const instanceId = process.env.GREEN_API_ID;
  const token = process.env.GREEN_API_TOKEN;
  if (!instanceId || !token) return null;
  return { instanceId, token };
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
}

// ---------------------------------------------------------------------------
// Localized Message Templates
// ---------------------------------------------------------------------------

const MESSAGE_TEMPLATES: Record<string, string> = {
  en: `🌊 *TALAGO Tours — Booking Confirmation*

Hello {customerName}! 🎉

Your booking *{bookingReference}* is now *{status}*.

🗺️ *Experience:* {tourTitle}
📅 *Date:* {travelDate}
👥 *Guests:* {guestCount}
🏨 *Hotel:* {hotelName}{pickupLine}
💰 *Total:* ${'{totalPrice}'}

🔗 *Access Your Dashboard:*
{magicLink}

For questions, reply to this message or call us at +20 122 243 4602.

See you soon! 🌅
— Talago Tours Team`,

  de: `🌊 *TALAGO Tours — Buchungsbestätigung*

Hallo {customerName}! 🎉

Ihre Buchung *{bookingReference}* ist jetzt *{status}*.

🗺️ *Erlebnis:* {tourTitle}
📅 *Datum:* {travelDate}
👥 *Gäste:* {guestCount}
🏨 *Hotel:* {hotelName}{pickupLine}
💰 *Gesamt:* ${'{totalPrice}'}

🔗 *Zugang zu Ihrem Dashboard:*
{magicLink}

Bei Fragen antworten Sie auf diese Nachricht oder rufen Sie +20 122 243 4602 an.

Bis bald! 🌅
— Talago Tours Team`,

  ru: `🌊 *TALAGO Tours — Подтверждение бронирования*

Здравствуйте, {customerName}! 🎉

Ваше бронирование *{bookingReference}* теперь *{status}*.

🗺️ *Тур:* {tourTitle}
📅 *Дата:* {travelDate}
👥 *Гости:* {guestCount}
🏨 *Отель:* {hotelName}{pickupLine}
💰 *Итого:* ${'{totalPrice}'}

🔗 *Доступ к панели управления:*
{magicLink}

По вопросам ответьте на это сообщение или позвоните +20 122 243 4602.

До встречи! 🌅
— Команда Talago Tours`,

  fr: `🌊 *TALAGO Tours — Confirmation de réservation*

Bonjour {customerName}! 🎉

Votre réservation *{bookingReference}* est maintenant *{status}*.

🗺️ *Expérience:* {tourTitle}
📅 *Date:* {travelDate}
👥 *Invités:* {guestCount}
🏨 *Hôtel:* {hotelName}{pickupLine}
💰 *Total:* ${'{totalPrice}'}

🔗 *Accédez à votre tableau de bord:*
{magicLink}

Pour toute question, répondez à ce message ou appelez le +20 122 243 4602.

À bientôt! 🌅
— L'équipe Talago Tours`,

  it: `🌊 *TALAGO Tours — Conferma prenotazione*

Ciao {customerName}! 🎉

La tua prenotazione *{bookingReference}* è ora *{status}*.

🗺️ *Esperienza:* {tourTitle}
📅 *Data:* {travelDate}
👥 *Ospiti:* {guestCount}
🏨 *Hotel:* {hotelName}{pickupLine}
💰 *Totale:* ${'{totalPrice}'}

🔗 *Accedi alla tua dashboard:*
{magicLink}

Per domande, rispondi a questo messaggio o chiama il +20 122 243 4602.

A presto! 🌅
— Team Talago Tours`,

  pl: `🌊 *TALAGO Tours — Potwierdzenie rezerwacji*

Cześć {customerName}! 🎉

Twoja rezerwacja *{bookingReference}* ma teraz status *{status}*.

🗺️ *Wycieczka:* {tourTitle}
📅 *Data:* {travelDate}
👥 *Goście:* {guestCount}
🏨 *Hotel:* {hotelName}{pickupLine}
💰 *Razem:* ${'{totalPrice}'}

🔗 *Dostęp do panelu:*
{magicLink}

W razie pytań odpowiedz na tę wiadomość lub zadzwoń +20 122 243 4602.

Do zobaczenia! 🌅
— Zespół Talago Tours`,

  es: `🌊 *TALAGO Tours — Confirmación de reserva*

¡Hola {customerName}! 🎉

Tu reserva *{bookingReference}* ahora está *{status}*.

🗺️ *Experiencia:* {tourTitle}
📅 *Fecha:* {travelDate}
👥 *Huéspedes:* {guestCount}
🏨 *Hotel:* {hotelName}{pickupLine}
💰 *Total:* ${'{totalPrice}'}

🔗 *Accede a tu panel:*
{magicLink}

Si tienes preguntas, responde a este mensaje o llama al +20 122 243 4602.

¡Hasta pronto! 🌅
— Equipo Talago Tours`,
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: { PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' },
  de: { PENDING: 'Ausstehend', CONFIRMED: 'Bestätigt', COMPLETED: 'Abgeschlossen', CANCELLED: 'Storniert' },
  ru: { PENDING: 'Ожидание', CONFIRMED: 'Подтверждено', COMPLETED: 'Завершено', CANCELLED: 'Отменено' },
  fr: { PENDING: 'En attente', CONFIRMED: 'Confirmé', COMPLETED: 'Terminé', CANCELLED: 'Annulé' },
  it: { PENDING: 'In attesa', CONFIRMED: 'Confermato', COMPLETED: 'Completato', CANCELLED: 'Annullato' },
  pl: { PENDING: 'Oczekujące', CONFIRMED: 'Potwierdzone', COMPLETED: 'Zakończone', CANCELLED: 'Anulowane' },
  es: { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' },
};

// ---------------------------------------------------------------------------
// Message Builder
// ---------------------------------------------------------------------------

function buildMessage(data: BookingNotificationData): string {
  const lang = data.language in MESSAGE_TEMPLATES ? data.language : 'en';
  const template = MESSAGE_TEMPLATES[lang];
  const statusLabel = STATUS_LABELS[lang]?.[data.status] ?? data.status;
  const baseUrl = getBaseUrl();
  const magicLink = `${baseUrl}/auth?email=${encodeURIComponent(data.customerEmail)}`;
  const pickupLine = data.pickupTime ? `\n🚐 *Pickup:* ${data.pickupTime}` : '';

  return template
    .replace('{customerName}', data.customerName)
    .replace('{bookingReference}', data.bookingReference)
    .replace('{status}', statusLabel)
    .replace('{tourTitle}', data.tourTitle)
    .replace('{travelDate}', data.travelDate)
    .replace('{guestCount}', String(data.guestCount))
    .replace('{hotelName}', data.hotelName)
    .replace('{pickupLine}', pickupLine)
    .replace('{totalPrice}', `$${data.totalPriceUSD.toFixed(2)}`)
    .replace('{magicLink}', magicLink);
}

// ---------------------------------------------------------------------------
// Phone Number Sanitizer
// ---------------------------------------------------------------------------

function sanitizePhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
}

// ---------------------------------------------------------------------------
// GREEN-API Dispatcher
// ---------------------------------------------------------------------------

async function sendViaGreenApi(
  phone: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getGreenApiConfig();
  if (!config) {
    return { success: false, error: 'GREEN-API credentials not configured' };
  }

  const chatId = `${sanitizePhoneForWhatsApp(phone)}@c.us`;
  const url = `https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.token}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `GREEN-API HTTP ${response.status}: ${errorText}` };
    }

    const result = (await response.json()) as GreenApiSendResponse;
    return { success: true, messageId: result.idMessage };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown GREEN-API error';
    return { success: false, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Public API — Send Booking Confirmation
// ---------------------------------------------------------------------------

export async function sendBookingConfirmation(
  data: BookingNotificationData,
): Promise<void> {
  const message = buildMessage(data);
  const result = await sendViaGreenApi(data.customerPhone, message);

  try {
    await prisma.notificationLog.create({
      data: {
        bookingId: data.bookingId,
        channel: 'WHATSAPP',
        recipient: data.customerPhone,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error ?? null,
        messageId: result.messageId ?? null,
        sentAt: new Date(),
      },
    });
  } catch (logError) {
    console.error('Failed to log WhatsApp notification:', logError);
  }
}

// ---------------------------------------------------------------------------
// Helper — Build data from a Booking ID (fetches from DB)
// ---------------------------------------------------------------------------

export async function dispatchBookingWhatsApp(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: { select: { translations: true } },
      },
    });

    if (!booking) {
      console.error(`WhatsApp dispatch: Booking ${bookingId} not found`);
      return;
    }

    if (!booking.whatsappOptIn) {
      console.log(`WhatsApp dispatch: Guest opted out for booking ${bookingId}`);
      return;
    }

    const translations = booking.tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = translations?.[booking.language]?.title
      ?? translations?.en?.title
      ?? 'Talago Experience';

    const travelDateFormatted = booking.travelDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await sendBookingConfirmation({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      tourTitle,
      travelDate: travelDateFormatted,
      hotelName: booking.hotelName,
      guestCount: booking.guestCount,
      totalPriceUSD: booking.totalPriceUSD,
      language: booking.language,
      status: booking.status,
    });
  } catch (err) {
    console.error('WhatsApp dispatch error:', err);
  }
}
