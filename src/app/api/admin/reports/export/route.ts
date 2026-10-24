export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportQueryParams {
  from?: string;
  to?: string;
}

interface BookingExportRow {
  Reference: string;
  Guest: string;
  Email: string;
  Phone: string;
  Tour: string;
  Destination: string;
  TravelDate: string;
  GuestCount: number;
  BookingStatus: string;
  AmountPaidOnline: string;
  AmountDueOnArrival: string;
  PaymentProvider: string;
  PaymentStatus: string;
  Channel: string;
  Hotel: string;
  Language: string;
  CreatedAt: string;
}

// ---------------------------------------------------------------------------
// CSV Builder
// ---------------------------------------------------------------------------

function escapeCSVField(value: string): string {
  // Spreadsheet applications treat leading formula characters as executable
  // formulas. Customer-provided fields must remain literal text on export.
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (safeValue.includes(',') || safeValue.includes('"') || safeValue.includes('\n') || safeValue.includes('\r')) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

function buildCSVHeader(columns: string[]): string {
  return columns.map(escapeCSVField).join(',');
}

function buildCSVRow(row: BookingExportRow): string {
  const values: string[] = [
    row.Reference,
    row.Guest,
    row.Email,
    row.Phone,
    row.Tour,
    row.Destination,
    row.TravelDate,
    String(row.GuestCount),
    row.BookingStatus,
    row.AmountPaidOnline,
    row.AmountDueOnArrival,
    row.PaymentProvider,
    row.PaymentStatus,
    row.Channel,
    row.Hotel,
    row.Language,
    row.CreatedAt,
  ];
  return values.map(escapeCSVField).join(',');
}

// ---------------------------------------------------------------------------
// GET — Export bookings as CSV
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Default range: last 90 days
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 90);

    const fromDate = fromParam ? new Date(`${fromParam}T00:00:00`) : defaultFrom;
    const toDate = toParam ? new Date(`${toParam}T23:59:59`) : now;

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        tour: {
          select: {
            translations: true,
            destination: { select: { name: true } },
          },
        },
        transaction: {
          select: {
            provider: true,
            status: true,
            amountPaidOnline: true,
            amountDueOnArrival: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV rows
    const columns = [
      'Reference',
      'Guest',
      'Email',
      'Phone',
      'Tour',
      'Destination',
      'TravelDate',
      'GuestCount',
      'BookingStatus',
      'AmountPaidOnline',
      'AmountDueOnArrival',
      'PaymentProvider',
      'PaymentStatus',
      'Channel',
      'Hotel',
      'Language',
      'CreatedAt',
    ];

    const rows: string[] = [buildCSVHeader(columns)];

    for (const booking of bookings) {
      const translations = booking.tour.translations as Record<string, { title?: string }> | null;
      const tourTitle = translations?.en?.title ?? 'Untitled';

      const row: BookingExportRow = {
        Reference: booking.bookingReference,
        Guest: booking.customerName,
        Email: booking.customerEmail,
        Phone: booking.customerPhone,
        Tour: tourTitle,
        Destination: booking.tour.destination?.name ?? 'N/A',
        TravelDate: booking.travelDate.toISOString().split('T')[0],
        GuestCount: booking.guestCount,
        BookingStatus: booking.status,
        AmountPaidOnline: booking.transaction
          ? Number(booking.transaction.amountPaidOnline).toFixed(2)
          : '0.00',
        AmountDueOnArrival: booking.transaction
          ? Number(booking.transaction.amountDueOnArrival).toFixed(2)
          : '0.00',
        PaymentProvider: booking.transaction?.provider ?? 'N/A',
        PaymentStatus: booking.transaction?.status ?? 'N/A',
        Channel: booking.channel,
        Hotel: booking.hotelName ?? '',
        Language: booking.language,
        CreatedAt: booking.createdAt.toISOString(),
      };

      rows.push(buildCSVRow(row));
    }

    const csvContent = '\uFEFF' + rows.join('\r\n'); // BOM for Excel UTF-8 compat
    const dateStamp = now.toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="talago-bookings-export-${dateStamp}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Internal server error during export', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
