import { NextRequest, NextResponse } from 'next/server';
import {
  createOrResumeTranslationJob,
  getTranslationJob,
} from '@/lib/translation-jobs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const tourId = req.nextUrl.searchParams.get('tourId');

    if (id) {
      const job = await getTranslationJob(id);
      if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      return NextResponse.json({ success: true, job });
    }

    if (tourId) {
      const latest = await prisma.translationJob.findFirst({
        where: { tourId },
        orderBy: { createdAt: 'desc' },
      });
      if (!latest) return NextResponse.json({ success: true, job: null });
      const job = await getTranslationJob(latest.id);
      return NextResponse.json({ success: true, job });
    }

    return NextResponse.json({ success: false, error: 'id or tourId is required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tourId, source, targetLangs } = body;

    if (!tourId || !source || !source.title) {
      return NextResponse.json(
        { success: false, error: 'tourId and source with title are required' },
        { status: 400 }
      );
    }

    const job = await createOrResumeTranslationJob(tourId, source, targetLangs);
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
