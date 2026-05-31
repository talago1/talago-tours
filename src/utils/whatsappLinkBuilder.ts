import type { ActiveQueueTicket } from '@/types/booking';

const TEMPLATES: Record<string, string> = {
  en: `Hi {customerName}! This is Talago Tours confirming your booking ({bookingReference}) for {tourTitle} on {travelDate}{pickupText}. Your pickup zone is {hotelName}. Total guests: {guestCount}. Total: ${'{totalPriceUSD}'}. View your digital voucher: {voucherUrl}. See you soon!`,
  de: `Hallo {customerName}! Hier ist Talago Tours zur Bestätigung Ihrer Buchung ({bookingReference}) für {tourTitle} am {travelDate}{pickupText}. Ihre Abholzone ist {hotelName}. Gäste: {guestCount}. Gesamt: ${'{totalPriceUSD}'}. Ihr digitales Voucher: {voucherUrl}. Wir freuen uns auf Sie!`,
  ru: `Здравствуйте, {customerName}! Это Talago Tours подтверждает ваше бронирование ({bookingReference}) на {tourTitle} {travelDate}{pickupText}. Ваша зона встречи: {hotelName}. Количество гостей: {guestCount}. Итого: ${'{totalPriceUSD}'}. Ваш цифровой ваучер: {voucherUrl}. До встречи!`,
  fr: `Bonjour {customerName}! Talago Tours confirme votre réservation ({bookingReference}) pour {tourTitle} le {travelDate}{pickupText}. Votre zone de prise en charge est {hotelName}. Nombre d'invités: {guestCount}. Total: ${'{totalPriceUSD}'}. Votre voucher numérique: {voucherUrl}. À bientôt!`,
  it: `Ciao {customerName}! Talago Tours conferma la tua prenotazione ({bookingReference}) per {tourTitle} il {travelDate}{pickupText}. La tua zona di prelievo è {hotelName}. Ospiti: {guestCount}. Totale: ${'{totalPriceUSD}'}. Il tuo voucher digitale: {voucherUrl}. A presto!`,
  tr: `Merhaba {customerName}! Talago Tours, {tourTitle} için rezervasyonunuzu ({bookingReference}) {travelDate} tarihinde onaylıyor{pickupText}. Alım bölgeniz: {hotelName}. Misafir sayısı: {guestCount}. Toplam: ${'{totalPriceUSD}'}. Dijital kuponunuz: {voucherUrl}. Görüşmek üzere!`,
};

function interpolate(template: string, ticket: ActiveQueueTicket): string {
  const pickupText = ticket.pickupTime ? ` Pickup at ${ticket.pickupTime}.` : '';
  return template
    .replace('{customerName}', ticket.customerName)
    .replace('{bookingReference}', ticket.bookingReference)
    .replace('{tourTitle}', ticket.tourTitle)
    .replace('{travelDate}', ticket.travelDate)
    .replace('{pickupText}', pickupText)
    .replace('{hotelName}', ticket.hotelName)
    .replace('{guestCount}', String(ticket.guestCount))
    .replace('{totalPriceUSD}', `$${ticket.totalPriceUSD.toFixed(2)}`)
    .replace('{voucherUrl}', ticket.voucherUrl || '');
}

export function buildWhatsAppMessage(ticket: ActiveQueueTicket): string {
  const template = TEMPLATES[ticket.language] || TEMPLATES.en;
  return interpolate(template, ticket);
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/^\+/, '').replace(/\s/g, '');
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
}
