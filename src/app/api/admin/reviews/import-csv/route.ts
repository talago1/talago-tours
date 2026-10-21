import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalculateTourRatingsStandalone } from '@/utils/calculateTourRatings';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/reviews/import-csv
 *
 * Accepts multipart/form-data with a single `file` field containing a CSV.
 *
 * Required CSV columns (case-insensitive):
 *   tour_name | tour_slug | source | reviewer_name | country | rating |
 *   review_date | original_text | original_language
 *
 * Optional columns:
 *   translated_text | source_url | comment
 *
 * All rows are created with:
 *   - status: APPROVED
 *   - isSeeded: false
 *   - isVisible: true
 *
 * Unmatched tour rows are returned in the `queued` array for admin review.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await (file as File).text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 });
    }

    // Parse header → column index map (case-insensitive, trim)
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const col = (name: string): number => header.indexOf(name);

    const COL = {
      tourName: col('tour_name'),
      tourSlug: col('tour_slug'),
      source: col('source'),
      reviewerName: col('reviewer_name'),
      country: col('country'),
      rating: col('rating'),
      reviewDate: col('review_date'),
      originalText: col('original_text'),
      originalLanguage: col('original_language'),
      translatedText: col('translated_text'),
      sourceUrl: col('source_url'),
      comment: col('comment'),
    };

    // Fetch all active tours for matching
    const allTours = await prisma.tour.findMany({
      where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
      select: { id: true, slug: true, translations: true },
    });

    const slugIndex = new Map(allTours.map((t) => [t.slug.toLowerCase(), t.id]));
    const nameIndex = new Map(
      allTours.map((t) => {
        const trans = t.translations as Record<string, { title?: string }> | null;
        const title = (trans?.en?.title ?? t.slug).toLowerCase();
        return [title, t.id];
      })
    );

    const imported: string[] = [];
    const queued: Array<{ row: number; tourName: string; reviewerName: string; reason: string }> = [];
    const errors: Array<{ row: number; reason: string }> = [];

    const parseCell = (row: string[], idx: number): string => {
      if (idx === -1) return '';
      return (row[idx] ?? '').replace(/^"|"$/g, '').trim();
    };

    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i];
      // Simple CSV split (handles quoted fields without embedded commas)
      const cells = rawLine.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) ?? rawLine.split(',');
      const row = cells.map((c) => c.trim().replace(/^"|"$/g, ''));

      const rawRating = parseCell(row, COL.rating);
      const ratingNum = parseInt(rawRating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        errors.push({ row: i + 1, reason: `Invalid rating: "${rawRating}"` });
        continue;
      }

      const tourNameRaw = parseCell(row, COL.tourName);
      const tourSlugRaw = parseCell(row, COL.tourSlug);
      const reviewerName = parseCell(row, COL.reviewerName) || 'Anonymous';
      const country = parseCell(row, COL.country).toUpperCase().slice(0, 5) || null;
      const sourceRaw = parseCell(row, COL.source).toUpperCase();
      const VALID_SOURCES = ['TALAGO', 'GETYOURGUIDE', 'VIATOR', 'TRIPADVISOR', 'SPUTNIK8', 'TRIPSTER', 'BOOKING_COM', 'GOOGLE', 'OTHER'];
      const source = VALID_SOURCES.includes(sourceRaw) ? sourceRaw : 'OTHER';
      const originalText = parseCell(row, COL.originalText) || parseCell(row, COL.comment);
      const originalLanguage = parseCell(row, COL.originalLanguage).toLowerCase().slice(0, 5) || 'en';
      const translatedText = parseCell(row, COL.translatedText) || null;
      const sourceUrl = parseCell(row, COL.sourceUrl) || null;
      const reviewDateRaw = parseCell(row, COL.reviewDate);
      const reviewDate = reviewDateRaw ? new Date(reviewDateRaw) : new Date();

      // Match tour by slug first, then by name
      let tourId: string | undefined;
      if (tourSlugRaw) tourId = slugIndex.get(tourSlugRaw.toLowerCase());
      if (!tourId && tourNameRaw) tourId = nameIndex.get(tourNameRaw.toLowerCase());

      if (!tourId) {
        queued.push({ row: i + 1, tourName: tourNameRaw || tourSlugRaw, reviewerName, reason: 'Tour not matched' });
        continue;
      }

      if (!originalText) {
        errors.push({ row: i + 1, reason: 'original_text (or comment) is required' });
        continue;
      }

      await prisma.review.create({
        data: {
          tourId,
          reviewerName,
          customerName: reviewerName,
          country: country ?? undefined,
          rating: ratingNum,
          comment: translatedText || originalText,
          originalText,
          originalLanguage,
          translatedText,
          source: source as any,
          sourceUrl: sourceUrl ?? undefined,
          reviewDate: isNaN(reviewDate.getTime()) ? new Date() : reviewDate,
          status: 'APPROVED',
          isSeeded: false,
          isVisible: true,
        },
      });
      imported.push(tourId);
    }

    // Recalculate ratings for all affected tours
    const uniqueTourIds = [...new Set(imported)];
    for (const tId of uniqueTourIds) {
      try {
        await recalculateTourRatingsStandalone(tId);
      } catch {
        // non-critical
      }
    }

    return NextResponse.json({
      imported: imported.length,
      queued: queued.length,
      errors: errors.length,
      queuedRows: queued,
      errorRows: errors,
      affectedTours: uniqueTourIds.length,
    });
  } catch (err) {
    console.error('[import-csv]', err);
    return NextResponse.json({ error: 'Import failed', detail: String(err) }, { status: 500 });
  }
}
