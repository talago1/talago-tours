import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * GET: Audits the tour and returns preview statistics for the Delete / Replace workflow.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { id: params.id },
      include: {
        destination: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const translations = tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = translations?.en?.title || tour.slug;

    // 1. Fetch bookings breakdown
    const bookings = await prisma.booking.findMany({
      where: { tourId: params.id },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        totalPriceUSD: true,
        amountPaidOnline: true,
        amountDueOnArrival: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        travelDate: true,
        createdAt: true,
        transaction: {
          select: { id: true, provider: true, amountPaidOnline: true, status: true },
        },
      },
    });

    const bookingsByStatus: Record<string, number> = {
      CONFIRMED: 0,
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    let totalRevenueUSD = 0;
    let totalPaidOnlineUSD = 0;
    let financialTransactionsCount = 0;
    const customerEmails = new Set<string>();

    bookings.forEach((b) => {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
      totalRevenueUSD += b.totalPriceUSD || 0;
      totalPaidOnlineUSD += b.amountPaidOnline || 0;
      if (b.customerEmail) customerEmails.add(b.customerEmail.toLowerCase().trim());
      if (b.transaction || (b.amountPaidOnline && b.amountPaidOnline > 0)) {
        financialTransactionsCount += 1;
      }
    });

    // 2. Fetch reviews breakdown
    const reviews = await prisma.review.findMany({
      where: { tourId: params.id },
      select: {
        id: true,
        reviewerName: true,
        customerName: true,
        rating: true,
        comment: true,
        originalText: true,
        status: true,
        isVisible: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch candidate replacement tours (active tours in catalog)
    const activeTours = await prisma.tour.findMany({
      where: {
        id: { not: params.id },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        slug: true,
        category: true,
        basePriceUSD: true,
        adultPrice: true,
        durationHours: true,
        destinationId: true,
        translations: true,
        destination: { select: { id: true, name: true } },
      },
      take: 50,
    });

    const candidateReplacementTours = activeTours.map((at) => {
      const atTrans = at.translations as Record<string, { title?: string }> | null;
      const isSameDestination = at.destinationId === tour.destinationId;
      return {
        id: at.id,
        slug: at.slug,
        title: atTrans?.en?.title || at.slug,
        category: at.category,
        destination: at.destination?.name || 'General',
        destinationId: at.destinationId,
        adultPrice: at.adultPrice ?? at.basePriceUSD,
        durationHours: at.durationHours,
        isSameDestination,
      };
    }).sort((a, b) => (b.isSameDestination ? 1 : 0) - (a.isSameDestination ? 1 : 0));

    return NextResponse.json({
      tour: {
        id: tour.id,
        slug: tour.slug,
        title: tourTitle,
        category: tour.category,
        destination: tour.destination?.name,
        destinationId: tour.destinationId,
        status: tour.status,
        durationHours: tour.durationHours,
        adultPrice: tour.adultPrice ?? tour.basePriceUSD,
      },
      stats: {
        totalBookings: bookings.length,
        bookingsByStatus,
        totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
        totalPaidOnlineUSD: Math.round(totalPaidOnlineUSD * 100) / 100,
        financialTransactionsCount,
        uniqueCustomersCount: customerEmails.size,
        totalReviews: reviews.length,
        ratingAverage: tour.ratingAverage,
      },
      reviews,
      candidateReplacementTours,
    });
  } catch (error: any) {
    console.error('[delete-workflow-audit] Error:', error);
    return NextResponse.json({ error: 'Failed to inspect tour for deletion workflow' }, { status: 500 });
  }
}

/**
 * POST: Executes the selected option:
 * OPTION_A: Permanently remove tour from catalog while preserving historical bookings & reviews.
 * OPTION_B: Permanently delete tour and eligible related records after exact title confirmation.
 * OPTION_C: Replace old tour and transfer compatible bookings & eligible reviews.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { id: params.id },
      include: {
        destination: true,
      },
    });

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const translations = tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = translations?.en?.title || tour.slug;

    const body = await request.json().catch(() => ({}));
    const {
      mode,
      confirmationText,
      replacementTourId,
      reviewMigrationStrategy,
      selectedReviewIds,
    } = body;

    // ── OPTION A: Permanently Remove Tour, Preserve Existing Bookings ────────
    if (mode === 'OPTION_A_PRESERVE_BOOKINGS') {
      const timestamp = Date.now();
      const removedSlug = `removed-${timestamp}-${tour.slug.slice(0, 40)}`;

      await prisma.$transaction(async (tx) => {
        // 1. Rename slug to free the original URL, set status to PERMANENTLY_REMOVED
        await tx.tour.update({
          where: { id: params.id },
          data: {
            status: 'PERMANENTLY_REMOVED',
            slug: removedSlug,
            internalNotes: `Tour removed from active catalog on ${new Date().toISOString()}. Preserved for historical booking audit.`,
          },
        });

        // 2. Add historical snapshot audit record into related bookings
        const bookings = await tx.booking.findMany({
          where: { tourId: params.id },
          select: { id: true, bookingAnswers: true },
        });

        for (const b of bookings) {
          const currentAnswers = (b.bookingAnswers as Record<string, any>) || {};
          await tx.booking.update({
            where: { id: b.id },
            data: {
              bookingAnswers: {
                ...currentAnswers,
                _historicalTourSnapshot: {
                  originalTourId: tour.id,
                  originalTitle: tourTitle,
                  originalSlug: tour.slug,
                  removedAt: new Date().toISOString(),
                },
              },
            },
          });
        }
      }, { timeout: 30000, maxWait: 15000 });

      // Clear caches
      try {
        revalidatePath('/tours');
        revalidatePath(`/tours/${tour.slug}`);
        revalidatePath('/admin/tours');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        mode: 'OPTION_A_PRESERVE_BOOKINGS',
        message: `Tour "${tourTitle}" has been permanently removed from the public and active catalog. All existing bookings and financial records remain preserved.`,
      });
    }

    // ── OPTION B: Permanently Delete Tour and Eligible Related Records ───────
    if (mode === 'OPTION_B_HARD_DELETE') {
      const cleanConf = (confirmationText || '').trim().toLowerCase();
      const cleanTitle = tourTitle.trim().toLowerCase();
      const cleanSlug = tour.slug.trim().toLowerCase();

      if (cleanConf !== cleanTitle && cleanConf !== cleanSlug) {
        return NextResponse.json(
          {
            error: `Confirmation text did not match the tour name. Please enter "${tourTitle}" or "${tour.slug}" to confirm deletion.`,
          },
          { status: 400 }
        );
      }

      // Check financial accounting records
      const paidBookingsCount = await prisma.booking.count({
        where: {
          tourId: params.id,
          OR: [
            { amountPaidOnline: { gt: 0 } },
            { transaction: { isNot: null } },
          ],
        },
      });

      if (paidBookingsCount > 0) {
        return NextResponse.json(
          {
            error: `Integrity Protection: This tour has ${paidBookingsCount} booking(s) with completed financial transactions. Financial accounting regulations prohibit hard-deleting transaction records. Please use Option A to permanently remove the tour from the catalog while preserving accounting records, or Option C to transfer bookings to a replacement experience.`,
            paidBookingsCount,
          },
          { status: 409 }
        );
      }

      let deletedBookingsCount = 0;
      await prisma.$transaction(async (tx) => {
        // Delete related non-financial bookings
        const delBookings = await tx.booking.deleteMany({
          where: { tourId: params.id },
        });
        deletedBookingsCount = delBookings.count;

        // Delete reviews
        await tx.review.deleteMany({
          where: { tourId: params.id },
        });

        // Delete time slots
        await tx.tourTimeSlot.deleteMany({
          where: { tourId: params.id },
        });

        // Delete media assets
        await tx.mediaAsset.deleteMany({
          where: { tourId: params.id },
        });

        // Delete the tour record
        await tx.tour.delete({
          where: { id: params.id },
        });
      }, { timeout: 30000, maxWait: 15000 });

      // Clear caches
      try {
        revalidatePath('/tours');
        revalidatePath(`/tours/${tour.slug}`);
        revalidatePath('/admin/tours');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        mode: 'OPTION_B_HARD_DELETE',
        message: `Tour "${tourTitle}" and its ${deletedBookingsCount} eligible record(s) have been permanently deleted.`,
        deletedBookingsCount,
      });
    }

    // ── OPTION C: Replace Old Tour and Transfer Compatible Bookings ───────────
    if (mode === 'OPTION_C_REPLACE_TRANSFER') {
      if (!replacementTourId || typeof replacementTourId !== 'string') {
        return NextResponse.json({ error: 'A replacement tour must be selected.' }, { status: 400 });
      }

      if (replacementTourId === params.id) {
        return NextResponse.json({ error: 'Replacement tour cannot be the same as the old tour.' }, { status: 400 });
      }

      const replacementTour = await prisma.tour.findUnique({
        where: { id: replacementTourId },
        select: {
          id: true,
          slug: true,
          translations: true,
          status: true,
          destinationId: true,
        },
      });

      if (!replacementTour) {
        return NextResponse.json({ error: 'Replacement tour does not exist.' }, { status: 404 });
      }

      const repTrans = replacementTour.translations as Record<string, { title?: string }> | null;
      const repTitle = repTrans?.en?.title || replacementTour.slug;

      let transferredBookingsCount = 0;
      let transferredReviewsCount = 0;

      await prisma.$transaction(async (tx) => {
        // 1. Transfer all bookings to replacement tour
        const existingBookings = await tx.booking.findMany({
          where: { tourId: params.id },
          select: { id: true, bookingAnswers: true },
        });

        for (const b of existingBookings) {
          const currentAnswers = (b.bookingAnswers as Record<string, any>) || {};
          await tx.booking.update({
            where: { id: b.id },
            data: {
              tourId: replacementTour.id,
              bookingAnswers: {
                ...currentAnswers,
                _transferredFromTour: {
                  originalTourId: tour.id,
                  originalTitle: tourTitle,
                  originalSlug: tour.slug,
                  replacementTourId: replacementTour.id,
                  replacementTitle: repTitle,
                  transferredAt: new Date().toISOString(),
                },
              },
            },
          });
          transferredBookingsCount += 1;
        }

        // 2. Transfer reviews based on strategy
        if (reviewMigrationStrategy === 'TRANSFER_ALL') {
          const res = await tx.review.updateMany({
            where: { tourId: params.id },
            data: { tourId: replacementTour.id },
          });
          transferredReviewsCount = res.count;
        } else if (reviewMigrationStrategy === 'TRANSFER_SELECTED' && Array.isArray(selectedReviewIds)) {
          const res = await tx.review.updateMany({
            where: {
              tourId: params.id,
              id: { in: selectedReviewIds },
            },
            data: { tourId: replacementTour.id },
          });
          transferredReviewsCount = res.count;
        } else if (reviewMigrationStrategy === 'HIDE_ALL') {
          await tx.review.updateMany({
            where: { tourId: params.id },
            data: { isVisible: false },
          });
        }

        // 3. Recalculate rating on replacement tour if reviews were migrated
        if (transferredReviewsCount > 0) {
          const allRepReviews = await tx.review.findMany({
            where: {
              tourId: replacementTour.id,
              status: 'APPROVED',
              isVisible: true,
              isSeeded: false,
            },
            select: { rating: true },
          });

          if (allRepReviews.length > 0) {
            const sum = allRepReviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = Math.round((sum / allRepReviews.length) * 10) / 10;
            await tx.tour.update({
              where: { id: replacementTour.id },
              data: {
                ratingAverage: avg,
                ratingCount: allRepReviews.length,
              },
            });
          }
        }

        // 4. Update old tour status to REPLACED and free its slug
        const timestamp = Date.now();
        await tx.tour.update({
          where: { id: params.id },
          data: {
            status: 'REPLACED',
            slug: `replaced-${timestamp}-${tour.slug.slice(0, 40)}`,
            internalNotes: `Replaced by tour "${repTitle}" (ID: ${replacementTour.id}) on ${new Date().toISOString()}. ${transferredBookingsCount} bookings transferred.`,
          },
        });
      }, { timeout: 30000, maxWait: 15000 });

      // Clear caches
      try {
        revalidatePath('/tours');
        revalidatePath(`/tours/${tour.slug}`);
        revalidatePath(`/tours/${replacementTour.slug}`);
        revalidatePath('/admin/tours');
      } catch (e) {}

      return NextResponse.json({
        success: true,
        mode: 'OPTION_C_REPLACE_TRANSFER',
        message: `Successfully transferred ${transferredBookingsCount} booking(s) and ${transferredReviewsCount} review(s) to "${repTitle}". Old tour removed from catalog.`,
        transferredBookingsCount,
        transferredReviewsCount,
        replacementTourTitle: repTitle,
      });
    }

    return NextResponse.json({ error: `Unsupported workflow mode: ${mode}` }, { status: 400 });
  } catch (error: any) {
    console.error('[delete-workflow-execute] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute tour delete workflow' }, { status: 500 });
  }
}
