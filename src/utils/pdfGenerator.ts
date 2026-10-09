import { encodeQr } from './qrEncoder';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export interface BoardingPassPdfParams {
  bookingId: string;
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  customerPhone: string;
  travelDate: string;
  hotelName: string;
  roomNumber?: string | null;
  pickupTime?: string | null;
  guestCount: number;
  totalPriceUSD: number;
  currency?: string | null;
  amountPaidOnline?: number | null;
  amountDueOnArrival?: number | null;
  status: string;
  qrPayload: string; // The cryptographically signed token
}

/**
 * Escapes characters for PDF literal strings (ASCII / WinAnsi)
 */
function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' '); // Keep safe ASCII
}

/**
 * Pure TypeScript PDF Builder for high-performance, zero-dependency A4 Boarding Passes.
 * Outputs a valid, compliant PDF 1.4 document.
 */
export function buildBoardingPassPdfBuffer(params: BoardingPassPdfParams): Buffer {
  const {
    bookingReference,
    tourTitle,
    customerName,
    customerPhone,
    travelDate,
    hotelName,
    roomNumber,
    pickupTime,
    guestCount,
    totalPriceUSD,
    currency,
    amountPaidOnline,
    amountDueOnArrival,
    status,
    qrPayload,
  } = params;

  // Page dimensions (A4 in PostScript points: 595.28 x 841.89)
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Compute vector QR module coordinates
  const qr = encodeQr(qrPayload);
  const qrSizePt = 160; // 160x160 points
  const qrX = 380;
  const qrY = 460;
  const moduleSize = qrSizePt / qr.size;

  let qrDrawingOps = '';
  // White background card for QR
  qrDrawingOps += `1 1 1 rg\n`;
  qrDrawingOps += `${qrX - 10} ${qrY - 10} ${qrSizePt + 20} ${qrSizePt + 20} re f\n`;
  // Black modules
  qrDrawingOps += `0.04 0.08 0.15 rg\n`; // Talago Navy
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.matrix[r][c] === 1) {
        // PDF origin (0,0) is bottom-left, so invert y
        const mx = (qrX + c * moduleSize).toFixed(2);
        const my = (qrY + (qr.size - 1 - r) * moduleSize).toFixed(2);
        const mDim = (moduleSize + 0.1).toFixed(2); // tiny overlap prevents hairline gaps
        qrDrawingOps += `${mx} ${my} ${mDim} ${mDim} re f\n`;
      }
    }
  }

  // Sanitize display fields
  const safeRef = escapePdfText(bookingReference);
  const safeTitle = escapePdfText(tourTitle.slice(0, 48));
  const safeCustomer = escapePdfText(customerName.slice(0, 40));
  const safePhone = escapePdfText(customerPhone.slice(0, 25));
  const safeDate = escapePdfText(travelDate);
  const safeHotel = escapePdfText((hotelName || 'Pickup Designated Point').slice(0, 40));
  const safeRoom = roomNumber ? `Room: ${escapePdfText(roomNumber)}` : 'Room: Not specified';
  const safeTime = pickupTime ? escapePdfText(pickupTime) : 'Standard Departure';
  const safeStatus = escapePdfText(status.toUpperCase());
  const curr = (currency || 'USD').toUpperCase();
  const currPrefix = curr === 'EUR' ? 'EUR ' : curr === 'GBP' ? 'GBP ' : curr === 'EGP' ? 'EGP ' : '$';
  const safePaid = `${currPrefix}${(amountPaidOnline ?? totalPriceUSD).toFixed(2)}`;
  const safeDue = `${currPrefix}${(amountDueOnArrival ?? 0).toFixed(2)}`;

  // Construct PDF Content Stream
  const contentStream = `
q
% Background Ticket Area
0.03 0.06 0.12 rg
30 60 535 720 re f

% Cyan Brand Top Bar
0.00 0.90 1.00 rg
30 770 535 10 re f

% Gold Header Accent
1.00 0.84 0.00 rg
30 766 535 4 re f

% Header Text
BT
/F2 22 Tf
1 1 1 rg
50 725 Td
(TALAGO TOURS & EXPERIENCES) Tj
ET

BT
/F1 11 Tf
0.00 0.90 1.00 rg
50 705 Td
(OFFICIAL GUEST BOARDING PASS & DISPATCH VOUCHER) Tj
ET

% Booking Ref Box
0.07 0.13 0.25 rg
50 640 290 48 re f
0.00 0.90 1.00 RG
1 w
50 640 290 48 re s

BT
/F1 9 Tf
0.7 0.8 0.9 rg
65 670 Td
(BOOKING REFERENCE) Tj
/F2 16 Tf
1 1 1 rg
0 -18 Td
(${safeRef}) Tj
ET

% Status Badge
0.05 0.35 0.25 rg
355 640 185 48 re f
BT
/F1 9 Tf
0.6 0.9 0.7 rg
370 670 Td
(PASSENGER STATUS) Tj
/F2 14 Tf
1 1 1 rg
0 -18 Td
(${safeStatus}) Tj
ET

% Experience Title Section
BT
/F1 10 Tf
0.6 0.7 0.8 rg
50 605 Td
(EXPERIENCE / TOUR) Tj
/F2 15 Tf
1 1 1 rg
0 -18 Td
(${safeTitle}) Tj
ET

% Divider
0.15 0.25 0.40 RG
0.5 w
50 565 m 545 565 l s

% Passenger Details Grid
BT
/F1 9 Tf
0.6 0.7 0.8 rg
50 540 Td
(LEAD TRAVELER) Tj
/F2 12 Tf
1 1 1 rg
0 -15 Td
(${safeCustomer}) Tj

/F1 9 Tf
0.6 0.7 0.8 rg
0 -20 Td
(PHONE / WHATSAPP) Tj
/F2 11 Tf
1 1 1 rg
0 -14 Td
(${safePhone}) Tj

/F1 9 Tf
0.6 0.7 0.8 rg
0 -20 Td
(TRAVEL DATE) Tj
/F2 11 Tf
1 1 1 rg
0 -14 Td
(${safeDate}) Tj

/F1 9 Tf
0.6 0.7 0.8 rg
0 -20 Td
(PICKUP TIME) Tj
/F2 11 Tf
0.00 0.90 1.00 rg
0 -14 Td
(${safeTime}) Tj

/F1 9 Tf
0.6 0.7 0.8 rg
0 -20 Td
(PICKUP LOCATION) Tj
/F2 11 Tf
1 1 1 rg
0 -14 Td
(${safeHotel}) Tj
/F1 9 Tf
0.7 0.7 0.8 rg
0 -12 Td
(${safeRoom}) Tj
ET

% Guests & Payment Box
0.07 0.13 0.25 rg
50 215 495 50 re f

BT
/F1 9 Tf
0.6 0.7 0.8 rg
70 248 Td
(TOTAL GUESTS) Tj
/F2 12 Tf
1 1 1 rg
0 -16 Td
(${guestCount} Passenger\\(s\\)) Tj

/F1 9 Tf
0.6 0.7 0.8 rg
150 16 Td
(ONLINE PAID) Tj
/F2 12 Tf
0.3 0.9 0.5 rg
0 -16 Td
(${safePaid}) Tj

/F1 9 Tf
0.6 0.7 0.8 rg
150 16 Td
(DUE ON ARRIVAL) Tj
/F2 12 Tf
1.0 0.8 0.2 rg
0 -16 Td
(${safeDue}) Tj
ET

% Vector QR Code Drawing
${qrDrawingOps}

BT
/F2 10 Tf
1 1 1 rg
375 435 Td
(VERIFIED DIGITAL PASS) Tj
/F1 8 Tf
0.6 0.7 0.8 rg
0 -13 Td
(Cryptographically signed HMAC-SHA256) Tj
0 -11 Td
(Scan upon boarding with guide or captain) Tj
ET

% Instructions & Support
BT
/F2 10 Tf
0.00 0.90 1.00 rg
50 170 Td
(BOARDING INSTRUCTIONS & LOGISTICS) Tj
/F1 8.5 Tf
0.8 0.85 0.9 rg
0 -15 Td
(1. Please have this QR Boarding Pass available on your smartphone or printed.) Tj
0 -13 Td
(2. Be ready at your hotel lobby / meeting point 10 minutes prior to scheduled pickup time.) Tj
0 -13 Td
(3. In case of schedule adjustments or flight updates, contact your 24/7 Talago Concierge.) Tj
ET

% Footer Note
BT
/F1 8 Tf
0.5 0.6 0.7 rg
50 95 Td
(TALAGO TOURS EGYPT - WhatsApp Concierge: +20 102 224 34602 - Support: info@talago.com) Tj
0 -12 Td
(Generated by Talago Reservation System - Non-Transferable Travel Document) Tj
ET

Q
`;

  // Build PDF Objects
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Object 2: Pages
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

  // Object 3: Page
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`
  );

  // Object 4: Contents Stream
  const streamBytes = Buffer.from(contentStream.trim(), 'utf-8');
  objects.push(
    `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${contentStream.trim()}\nendstream\nendobj\n`
  );

  // Object 5: Standard Font Helvetica
  objects.push(
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`
  );

  // Object 6: Standard Font Helvetica-Bold
  objects.push(
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`
  );

  // Calculate xref offsets
  let offset = 9; // '%PDF-1.4\n' length
  const xrefEntries = ['0000000000 65535 f \n'];

  const bodyBuffers: Buffer[] = [Buffer.from('%PDF-1.4\n', 'ascii')];

  for (const objStr of objects) {
    const objBuf = Buffer.from(objStr, 'utf-8');
    const paddedOffset = String(offset).padStart(10, '0');
    xrefEntries.push(`${paddedOffset} 00000 n \n`);
    bodyBuffers.push(objBuf);
    offset += objBuf.length;
  }

  const xrefOffset = offset;
  let xrefStr = `xref\n0 ${objects.length + 1}\n`;
  for (const entry of xrefEntries) {
    xrefStr += entry;
  }
  xrefStr += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  bodyBuffers.push(Buffer.from(xrefStr, 'ascii'));

  return Buffer.concat(bodyBuffers);
}

/**
 * Generates and uploads the Boarding Pass PDF to existing Supabase bucket 'talago-media'
 * and updates the Booking record with the public URL.
 */
export async function generateAndStoreBoardingPassPdf(bookingId: string): Promise<string | null> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true },
    });

    if (!booking || !booking.tour) {
      console.warn('[pdf] Booking not found for PDF generation:', bookingId);
      return null;
    }

    const { generateToken } = await import('./qrTokenCrypto');
    const qrPayload = generateToken(booking.id);

    const tourTitle = typeof booking.tour.translations === 'object' && booking.tour.translations
      ? ((booking.tour.translations as any)?.en?.title || (booking.tour.translations as any)?.[booking.language]?.title || 'Egypt Tour')
      : 'Egypt Tour';

    const pdfBuffer = buildBoardingPassPdfBuffer({
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      tourTitle,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      travelDate: new Date(booking.travelDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      hotelName: booking.hotelName || booking.pickupLocationName || 'Meeting Point',
      roomNumber: booking.roomNumber,
      pickupTime: booking.selectedPickupTime,
      guestCount: booking.guestCount,
      totalPriceUSD: booking.totalPriceUSD,
      currency: booking.currency,
      amountPaidOnline: booking.amountPaidOnline,
      amountDueOnArrival: booking.amountDueOnArrival,
      status: booking.status,
      qrPayload,
    });

    const bucketName = 'talago-media';
    const filePath = `boarding-passes/${booking.bookingReference}.pdf`;

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('[pdf] Supabase storage upload error:', error.message);
      return null;
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;

    // Persist to database
    await prisma.booking.update({
      where: { id: booking.id },
      data: { pdfBoardingPassUrl: publicUrl },
    });

    return publicUrl;
  } catch (err) {
    console.error('[pdf] Failed to generate/store boarding pass PDF:', err);
    return null;
  }
}
