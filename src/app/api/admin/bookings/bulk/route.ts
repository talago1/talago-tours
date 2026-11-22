import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function buildDateRangeFilter(year: string, month: string, dateBasis: 'travelDate' | 'createdAt') {
  if (year === 'ALL' && month === 'ALL') {
    return undefined;
  }

  const field = dateBasis === 'travelDate' ? 'travelDate' : 'createdAt';

  if (year !== 'ALL' && month !== 'ALL') {
    // Specific month in a specific year
    const m = month.padStart(2, '0');
    const start = new Date(`${year}-${m}-01T00:00:00.000Z`);
    // calculate end of month
    const nextMonth = Number(m) === 12 ? 1 : Number(m) + 1;
    const nextYear = Number(m) === 12 ? Number(year) + 1 : Number(year);
    const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`);

    return {
      [field]: {
        gte: start,
        lt: end,
      },
    };
  }

  if (year !== 'ALL' && month === 'ALL') {
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);
    return {
      [field]: {
        gte: start,
        lt: end,
      },
    };
  }

  return undefined;
}

/**
 * GET: Audits and previews all matching bookings across the entire dataset.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year') || 'ALL';
    const month = url.searchParams.get('month') || 'ALL';
    const dateBasis = (url.searchParams.get('dateBasis') === 'createdAt' ? 'createdAt' : 'travelDate') as 'travelDate' | 'createdAt';
    const status = url.searchParams.get('status') || 'ALL';
    const tourId = url.searchParams.get('tourId');

    const where: Prisma.BookingWhereInput = {};

    // Date filter
    const dateFilter = buildDateRangeFilter(year, month, dateBasis);
    if (dateFilter) {
      Object.assign(where, dateFilter);
    }

    // Status filter
    if (status !== 'ALL') {
      where.status = status as any;
    }

    // Tour filter
    if (tourId && tourId !== 'ALL') {
      where.tourId = tourId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        customerEmail: true,
        travelDate: true,
        createdAt: true,
        status: true,
        totalPriceUSD: true,
        amountPaidOnline: true,
        amountDueOnArrival: true,
        tourId: true,
        tourTitleSnapshot: true,
        tour: {
          select: {
            id: true,
            slug: true,
            translations: true,
          },
        },
        transaction: {
          select: { id: true, provider: true, amountPaidOnline: true, status: true },
        },
      },
      orderBy: { [dateBasis]: 'desc' },
    });

    const statusCounts: Record<string, number> = {
      CONFIRMED: 0,
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    let totalAmountUSD = 0;
    let paidOnlineUSD = 0;
    let dueOnArrivalUSD = 0;
    let financialRecordsToRetain = 0;
    let eligibleForHardDelete = 0;

    const tourMap = new Map<string, { id: string; title: string; count: number }>();
    const customerEmails = new Set<string>();

    bookings.forEach((b) => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      totalAmountUSD += b.totalPriceUSD || 0;
      paidOnlineUSD += b.amountPaidOnline || 0;
      dueOnArrivalUSD += b.amountDueOnArrival || 0;

      if (b.customerEmail) customerEmails.add(b.customerEmail.toLowerCase().trim());

      const hasFinancial = Boolean(b.transaction || (b.amountPaidOnline && b.amountPaidOnline > 0));
      if (hasFinancial) {
        financialRecordsToRetain += 1;
      } else {
        eligibleForHardDelete += 1;
      }

      const tTrans = b.tour?.translations as Record<string, { title?: string }> | null;
      const tTitle = b.tourTitleSnapshot || tTrans?.en?.title || b.tour?.slug || 'Historical Tour';
      const mapKey = b.tourId || 'historical-unassigned';
      const existing = tourMap.get(mapKey) || { id: mapKey, title: tTitle, count: 0 };
      existing.count += 1;
      tourMap.set(mapKey, existing);
    });

    return NextResponse.json({
      totalMatching: bookings.length,
      filters: {
        year,
        month,
        dateBasis,
        status,
        tourId,
      },
      statusCounts,
      financialSummary: {
        totalAmountUSD: Math.round(totalAmountUSD * 100) / 100,
        paidOnlineUSD: Math.round(paidOnlineUSD * 100) / 100,
        dueOnArrivalUSD: Math.round(dueOnArrivalUSD * 100) / 100,
        financialRecordsToRetain,
        eligibleForHardDelete,
      },
      associatedTours: Array.from(tourMap.values()).sort((a, b) => b.count - a.count),
      uniqueCustomersCount: customerEmails.size,
      sampleBookings: bookings.slice(0, 100).map((b) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        travelDate: b.travelDate.toISOString().split('T')[0],
        createdAt: b.createdAt.toISOString().split('T')[0],
        status: b.status,
        totalPriceUSD: b.totalPriceUSD,
        hasFinancialRecord: Boolean(b.transaction || (b.amountPaidOnline && b.amountPaidOnline > 0)),
      })),
    });
  } catch (error: any) {
    console.error('[bulk-bookings-preview] Error:', error);
    return NextResponse.json({ error: 'Failed to inspect bulk bookings.' }, { status: 500 });
  }
}

/**
 * POST: Executes bulk management (safe archive or permanent deletion of eligible records).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action,
      year,
      month,
      dateBasis = 'travelDate',
      status = 'ALL',
      tourId,
      specificIds,
      confirmationText,
    } = body;

    if (action !== 'ARCHIVE_STATUS' && action !== 'PERMANENT_DELETE') {
      return NextResponse.json({ error: 'Unsupported bulk action.' }, { status: 400 });
    }

    // Build query criteria
    const where: Prisma.BookingWhereInput = {};

    if (Array.isArray(specificIds) && specificIds.length > 0) {
      where.id = { in: specificIds };
    } else {
      const dateFilter = buildDateRangeFilter(year || 'ALL', month || 'ALL', dateBasis);
      if (dateFilter) {
        Object.assign(where, dateFilter);
      }
      if (status !== 'ALL') {
        where.status = status as any;
      }
      if (tourId && tourId !== 'ALL') {
        where.tourId = tourId;
      }
    }

    // Fetch all matching records
    const matchingBookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        bookingReference: true,
        status: true,
        amountPaidOnline: true,
        transaction: { select: { id: true } },
      },
    });

    if (matchingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings matched the criteria.',
        processed: 0,
        deleted: 0,
        archived: 0,
        retained: 0,
      });
    }

    // ── ACTION A: Move to Recoverable Archive (Status = CANCELLED) ────────────
    if (action === 'ARCHIVE_STATUS') {
      const idsToUpdate = matchingBookings.map((b) => b.id);

      // Safe batch update in chunks of 50
      const CHUNK_SIZE = 50;
      let archivedCount = 0;

      for (let i = 0; i < idsToUpdate.length; i += CHUNK_SIZE) {
        const chunk = idsToUpdate.slice(i, i + CHUNK_SIZE);
        const res = await prisma.booking.updateMany({
          where: { id: { in: chunk } },
          data: { status: 'CANCELLED' },
        });
        archivedCount += res.count;
      }

      return NextResponse.json({
        success: true,
        action: 'ARCHIVE_STATUS',
        message: `Successfully updated ${archivedCount} booking(s) to CANCELLED status.`,
        processed: idsToUpdate.length,
        archived: archivedCount,
        retained: 0,
        deleted: 0,
      });
    }

    // ── ACTION B: Permanently Delete Eligible Records ────────────────────────
    if (action === 'PERMANENT_DELETE') {
      const expectedConfirmation = `DELETE ${matchingBookings.length} BOOKINGS`;
      const cleanConf = (confirmationText || '').trim().toUpperCase();

      if (cleanConf !== expectedConfirmation && cleanConf !== 'DELETE') {
        return NextResponse.json(
          {
            error: `Confirmation mismatch. Please type "${expectedConfirmation}" to confirm permanent deletion.`,
          },
          { status: 400 }
        );
      }

      // Financial Retention Rule:
      // Separate records with financial payments from eligible non-financial records
      const retainedIds: string[] = [];
      const eligibleIds: string[] = [];

      matchingBookings.forEach((b) => {
        const hasPayment = Boolean(b.transaction || (b.amountPaidOnline && b.amountPaidOnline > 0));
        if (hasPayment) {
          retainedIds.push(b.id);
        } else {
          eligibleIds.push(b.id);
        }
      });

      let deletedCount = 0;
      const CHUNK_SIZE = 50;

      for (let i = 0; i < eligibleIds.length; i += CHUNK_SIZE) {
        const chunk = eligibleIds.slice(i, i + CHUNK_SIZE);
        const chunkRefs = matchingBookings
          .filter((b) => chunk.includes(b.id))
          .map((b) => b.bookingReference)
          .filter(Boolean);

        await prisma.$transaction(async (tx) => {
          // Delete reviews associated with these bookings
          await tx.review.deleteMany({
            where: { bookingId: { in: chunk } },
          });
          // Delete leads associated with these bookings
          await tx.bookingLead.deleteMany({
            where: { bookingId: { in: chunk } },
          });
          // Delete associated chat conversations and notification logs
          await tx.liveChatConversation.deleteMany({
            where: {
              OR: [
                { bookingId: { in: chunk } },
                { bookingReference: { in: chunkRefs } },
              ],
            },
          });
          await tx.notificationLog.deleteMany({
            where: { bookingId: { in: chunk } },
          });
          // Delete bookings
          const res = await tx.booking.deleteMany({
            where: { id: { in: chunk } },
          });
          deletedCount += res.count;
        }, { timeout: 30000, maxWait: 15000 });
      }

      return NextResponse.json({
        success: true,
        action: 'PERMANENT_DELETE',
        message: `Successfully deleted ${deletedCount} eligible booking(s). ${retainedIds.length} booking(s) were safely retained for statutory financial accounting compliance.`,
        processed: matchingBookings.length,
        deleted: deletedCount,
        retained: retainedIds.length,
        archived: 0,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    console.error('[bulk-bookings-execute] Error:', error);
    return NextResponse.json({ error: error.message || 'Bulk operation failed' }, { status: 500 });
  }
}
