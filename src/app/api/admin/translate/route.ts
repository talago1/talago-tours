import { NextRequest, NextResponse } from 'next/server';
import { isAiConfigured, TourTranslationPayload } from '@/lib/gemini';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { getManagedLanguages } from '@/lib/languages';
import {
  translateChunk,
  CHUNK_KEYS,
  mergeChunkResults,
  ChunkKey,
} from '@/lib/translation-engine';

export const dynamic = 'force-dynamic';

const LIMIT = 60;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function GET() {
  try {
    const allLangs = await getManagedLanguages();
    const activeTargets = allLangs.filter((l) => !l.isSource && l.isActive && l.includeInTranslations);
    return NextResponse.json({
      success: true,
      activeTargetLanguages: activeTargets,
      chunkKeys: CHUNK_KEYS,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'ai-translate'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const configured = await isAiConfigured();
    if (!configured) {
      return NextResponse.json(
        {
          error:
            'No AI Provider is configured. Please configure an AI Provider in Admin Settings > AI Key Pool or set GEMINI_API_KEY in .env.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { source, targetLangs, mode, lang, chunkKey } = body as {
      source: TourTranslationPayload;
      targetLangs?: string[];
      mode?: 'chunk' | 'batch';
      lang?: string;
      chunkKey?: ChunkKey;
    };

    if (!source || !source.title) {
      return NextResponse.json(
        { error: 'Source experience title is required for translation.' },
        { status: 400 }
      );
    }

    // Load dynamic languages
    const allLangs = await getManagedLanguages();
    const activeTargets = allLangs.filter((l) => !l.isSource && l.isActive && l.includeInTranslations);

    // MODE 1: Single chunk execution (resumable / retry specific failed chunk)
    if (mode === 'chunk') {
      if (!lang || !chunkKey) {
        return NextResponse.json(
          { error: 'lang and chunkKey are required in chunk mode.' },
          { status: 400 }
        );
      }
      const targetLangMeta = allLangs.find((l) => l.code === lang);
      const result = await translateChunk(source, chunkKey, lang, targetLangMeta?.displayName);
      return NextResponse.json({
        success: true,
        result,
      });
    }

    // MODE 2: Batch execution (iterates chunk by chunk across all requested languages)
    const selectedLangCodes: string[] =
      Array.isArray(targetLangs) && targetLangs.length > 0
        ? targetLangs
        : activeTargets.map((l) => l.code);

    const translations: Record<string, Partial<TourTranslationPayload>> = {};
    const partialErrors: Array<{ lang: string; chunkKey: ChunkKey; error: string }> = [];

    for (const lCode of selectedLangCodes) {
      const targetLangMeta = allLangs.find((l) => l.code === lCode);
      let currentPayload: Partial<TourTranslationPayload> = {};

      for (const cKey of CHUNK_KEYS) {
        try {
          const chunkRes = await translateChunk(
            source,
            cKey,
            lCode,
            targetLangMeta?.displayName
          );
          currentPayload = mergeChunkResults(currentPayload, chunkRes.fields);
        } catch (err: any) {
          console.warn(`[ai-translate] Chunk failed for ${lCode}/${cKey}:`, err.message);
          partialErrors.push({
            lang: lCode,
            chunkKey: cKey,
            error: err.message,
          });
        }
      }

      translations[lCode] = currentPayload;
    }

    return NextResponse.json({
      success: true,
      translations,
      partialErrors: partialErrors.length > 0 ? partialErrors : undefined,
    });
  } catch (error: any) {
    console.error('AI translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-translate tour content' },
      { status: 500 }
    );
  }
}
