import { NextRequest, NextResponse } from 'next/server';
import { executeNextChunk } from '@/lib/translation-jobs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, source, targetLang, targetChunk } = body;

    if (!jobId || !source) {
      return NextResponse.json(
        { success: false, error: 'jobId and source are required' },
        { status: 400 }
      );
    }

    const result = await executeNextChunk(jobId, source, { targetLang, targetChunk });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
