import { NextRequest, NextResponse } from 'next/server';
import { isAiConfigured, TourTranslationPayload } from '@/lib/gemini';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { getManagedLanguages } from '@/lib/languages';
import {
  translateChunk,
  CHUNK_KEYS,
  mergeChunkResults,
  auditTranslationCompleteness,
  ChunkKey,
} from '@/lib/translation-engine';

export const dynamic = 'force-dynamic';

const LIMIT = 120;
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
    const { source, targetLangs, mode = 'language', lang, chunkKey, existingTranslation } = body as {
      source: TourTranslationPayload;
      targetLangs?: string[];
      mode?: 'chunk' | 'language' | 'batch' | 'audit';
      lang?: string;
      chunkKey?: ChunkKey;
      existingTranslation?: Partial<TourTranslationPayload>;
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

    // MODE 0: Audit completeness only
    if (mode === 'audit') {
      const targetLang = lang || 'de';
      const audit = auditTranslationCompleteness(source, existingTranslation, targetLang);
      return NextResponse.json({ success: true, audit });
    }

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

    // MODE 2: Single language complete sequential execution
    // (Recommended for client loop: translates one language completely, verifies completeness, and returns)
    if (mode === 'language') {
      const targetCode = lang || (targetLangs && targetLangs[0]) || activeTargets[0]?.code;
      if (!targetCode) {
        return NextResponse.json({ error: 'Target language is required.' }, { status: 400 });
      }

      const targetLangMeta = allLangs.find((l) => l.code === targetCode);
      let langPayload: Partial<TourTranslationPayload> = existingTranslation || {};
      const chunkResults: Record<string, any> = {};
      const chunkErrors: Record<string, string> = {};

      for (const cKey of CHUNK_KEYS) {
        try {
          const res = await translateChunk(source, cKey, targetCode, targetLangMeta?.displayName);
          langPayload = mergeChunkResults(langPayload, res.fields);
          chunkResults[cKey] = {
            fields: res.fields,
            provider: res.providerUsed,
            model: res.modelUsed,
          };
        } catch (err: any) {
          console.warn(`[ai-translate] Chunk ${cKey} failed for ${targetCode}:`, err.message);
          chunkErrors[cKey] = err.message;
        }
      }

      const audit = auditTranslationCompleteness(source, langPayload, targetCode);

      return NextResponse.json({
        success: true,
        lang: targetCode,
        translation: langPayload,
        audit,
        chunkResults,
        chunkErrors: Object.keys(chunkErrors).length > 0 ? chunkErrors : undefined,
      });
    }

    // MODE 3: Batch execution (Sequential language by language)
    const selectedLangCodes: string[] =
      Array.isArray(targetLangs) && targetLangs.length > 0
        ? targetLangs
        : activeTargets.map((l) => l.code);

    const translations: Record<string, Partial<TourTranslationPayload>> = {};
    const audits: Record<string, any> = {};
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
      audits[lCode] = auditTranslationCompleteness(source, currentPayload, lCode);
    }

    return NextResponse.json({
      success: true,
      translations,
      audits,
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
