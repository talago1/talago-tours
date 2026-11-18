import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const RESULTS_PATH = path.join(process.cwd(), 'scripts', 'data', 'match_results.json');
const SOURCES_DIR = path.join(process.cwd(), 'scripts', 'data', 'sources');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceFilter = searchParams.get('source');
    const classFilter = searchParams.get('class');
    const search = searchParams.get('search')?.toLowerCase();

    if (!fs.existsSync(RESULTS_PATH)) {
      return NextResponse.json({
        summary: { total: 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
        results: [],
        sources: []
      });
    }

    const data = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
    let items = data.results || [];

    if (sourceFilter && sourceFilter !== 'ALL') {
      items = items.filter((item: any) => item.source.toLowerCase() === sourceFilter.toLowerCase());
    }

    if (classFilter && classFilter !== 'ALL') {
      items = items.filter((item: any) => item.classification === classFilter);
    }

    if (search) {
      items = items.filter((item: any) =>
        (item.sourceName && item.sourceName.toLowerCase().includes(search)) ||
        (item.destination && item.destination.toLowerCase().includes(search)) ||
        (item.matchedTourTitle && item.matchedTourTitle.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      summary: data.summary,
      totalSourceTours: data.totalSourceTours,
      totalTalagoTours: data.totalTalagoTours,
      generatedAt: data.generatedAt,
      filteredCount: items.length,
      results: items.slice(0, 200) // return first 200 matches for snappy UI
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, item } = body;

    if (!action || !item) {
      return NextResponse.json({ error: 'Missing action or item' }, { status: 400 });
    }

    if (action === 'update-existing') {
      if (!item.matchedTourSlug) {
        return NextResponse.json({ error: 'No matched tour slug provided' }, { status: 400 });
      }

      // Find the existing tour
      const existing = await prisma.tour.findUnique({
        where: { slug: item.matchedTourSlug }
      });

      if (!existing) {
        return NextResponse.json({ error: 'Matched tour not found' }, { status: 404 });
      }

      // Safe non-destructive update: add source provenance note and populate missing fields
      const updated = await prisma.tour.update({
        where: { id: existing.id },
        data: {
          internalNotes: `[Reconciled from ${item.source}] sourceUrl=${item.sourceUrl || ''}; verifiedAt=${new Date().toISOString()}; previousNotes=${existing.internalNotes || ''}`.slice(0, 500),
          // Only update pricing if existing price was 0 or missing, never overwrite confirmed prices
          basePriceUSD: (existing.basePriceUSD && existing.basePriceUSD > 0) ? existing.basePriceUSD : (item.priceFrom || existing.basePriceUSD || 25),
          adultPrice: (existing.adultPrice && existing.adultPrice > 0) ? existing.adultPrice : (item.priceFrom || existing.adultPrice || 25),
        }
      });

      return NextResponse.json({ success: true, action: 'updated', tour: { id: updated.id, slug: updated.slug } });
    }

    if (action === 'create-draft') {
      // Find destination ID
      const destSlug = (item.destination || 'hurghada').toLowerCase().replace(/\s+/g, '-');
      let dest = await prisma.destination.findFirst({
        where: {
          OR: [
            { slug: { contains: destSlug } },
            { name: { contains: item.destination || '', mode: 'insensitive' } }
          ]
        }
      });

      if (!dest) {
        dest = await prisma.destination.findFirst();
      }

      const slug = `draft-${Date.now()}-${(item.sourceName || 'tour')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40)}`;

      const newTour = await prisma.tour.create({
        data: {
          slug,
          type: item.groupType === 'Private' ? 'PRIVATE' : 'SHARED',
          status: 'DRAFT', // NEVER published automatically!
          basePriceUSD: item.priceFrom || 30,
          adultPrice: item.priceFrom || 30,
          durationHours: item.durationHours || 4,
          maxCapacity: 15,
          destinationId: dest?.id,
          internalNotes: `[Import Candidate from ${item.source}] url=${item.sourceUrl}; importedAt=${new Date().toISOString()}`,
          translations: {
            en: {
              title: item.sourceName || 'New Tour Candidate',
              description: `Experience the best of ${item.destination || 'Egypt'} with this guided tour.`,
              cardExcerpt: item.sourceName || 'New Tour Candidate',
              highlights: [],
              inclusions: [],
              exclusions: [],
              whatToBring: '',
              importantInfo: '',
              pickupDescription: '',
              cancellationPolicy: 'Free cancellation up to 24 hours before start'
            }
          }
        }
      });

      return NextResponse.json({ success: true, action: 'created-draft', tour: { id: newTour.id, slug: newTour.slug } });
    }

    return NextResponse.json({ success: true, action: 'noop' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
