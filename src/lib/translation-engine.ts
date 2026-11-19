/**
 * Chunked, resumable translation engine for TALAGO.
 * Each request translates ONE language × ONE chunk group, keeping payloads small and preventing JSON truncation.
 * Server-only — never import into client bundle.
 */
import crypto from 'crypto';
import { executeAiPrompt } from '@/lib/ai-router';
import type { TourTranslationPayload } from '@/lib/gemini';
import { getManagedLanguages } from '@/lib/languages';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: translation-engine cannot be imported into client bundle.');
}

export type ChunkKey = 'core' | 'lists' | 'text' | 'faq' | 'itinerary';
export const CHUNK_KEYS: ChunkKey[] = ['core', 'lists', 'text', 'faq', 'itinerary'];

export interface ChunkResult {
  lang: string;
  chunkKey: ChunkKey;
  fields: Partial<TourTranslationPayload>;
  providerUsed: string;
  modelUsed: string;
  durationMs: number;
}

/** SHA-256 of the source JSON — used to detect stale jobs */
export function computeSourceHash(source: TourTranslationPayload): string {
  return crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex').slice(0, 32);
}

/** Returns only the fields belonging to this chunk */
export function buildChunkPayload(source: TourTranslationPayload, chunkKey: ChunkKey): Partial<TourTranslationPayload> {
  switch (chunkKey) {
    case 'core':
      return {
        title: source.title,
        ...(source.cardExcerpt ? { cardExcerpt: source.cardExcerpt } : {}),
        description: source.description,
        ...(source.seoTitle ? { seoTitle: source.seoTitle } : {}),
        ...(source.seoDescription ? { seoDescription: source.seoDescription } : {}),
        ...(source.keyActivityDetails?.length ? { keyActivityDetails: source.keyActivityDetails } : {}),
      };
    case 'lists':
      return {
        ...(source.highlights?.length ? { highlights: source.highlights } : {}),
        ...(source.inclusions?.length ? { inclusions: source.inclusions } : {}),
        ...(source.exclusions?.length ? { exclusions: source.exclusions } : {}),
        ...(source.safetyGuidelines?.length ? { safetyGuidelines: source.safetyGuidelines } : {}),
      };
    case 'text':
      return {
        ...(source.whatToBring ? { whatToBring: source.whatToBring } : {}),
        ...(source.requirements ? { requirements: source.requirements } : {}),
        ...(source.cancellationPolicy ? { cancellationPolicy: source.cancellationPolicy } : {}),
      };
    case 'faq':
      return {
        ...(source.faqItems?.length ? { faqItems: source.faqItems } : {}),
      };
    case 'itinerary':
      return {
        ...(source.itinerary?.length ? { itinerary: source.itinerary } : {}),
      };
  }
}

/** Builds the strict-JSON prompt for a single lang × chunk */
export function buildChunkPrompt(
  source: TourTranslationPayload,
  chunkKey: ChunkKey,
  langCode: string,
  langDisplayName?: string
): string {
  const payload = buildChunkPayload(source, chunkKey);
  const targetLanguage = langDisplayName || langCode.toUpperCase();

  // If no content in this chunk
  const hasContent = Object.keys(payload).some((k) => {
    const val = (payload as any)[k];
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  });

  if (!hasContent) {
    return '';
  }

  return `You are a professional travel copywriter and translator for TALAGO Tours.
Translate the following tourism content into fluent, natural ${targetLanguage} (${langCode}).

CRITICAL INSTRUCTIONS:
1. Maintain luxury, engaging travel tone.
2. Keep all place names (Hurghada, Cairo, Luxor, Nile, Red Sea, etc.) recognizable.
3. Preserve HTML formatting or line breaks if present.
4. Output strict JSON matching the exact keys of the input. Do NOT add any extra commentary or markdown formatting outside the JSON object.
5. Translate EVERY field present in the JSON.

SOURCE CONTENT (${chunkKey.toUpperCase()} CHUNK):
${JSON.stringify(payload, null, 2)}`;
}

/** Translates a single chunk for a single language with timeout and error handling */
export async function translateChunk(
  source: TourTranslationPayload,
  chunkKey: ChunkKey,
  lang: string,
  langDisplayName?: string,
  options?: { timeoutMs?: number }
): Promise<ChunkResult> {
  const prompt = buildChunkPrompt(source, chunkKey, lang, langDisplayName);

  // If chunk has no content, return empty fields immediately
  if (!prompt) {
    return {
      lang,
      chunkKey,
      fields: {},
      providerUsed: 'skipped',
      modelUsed: 'none',
      durationMs: 0,
    };
  }

  const startTime = Date.now();
  const systemPrompt = `You are a specialized tourism translator for TALAGO. You always return strictly valid JSON matching the input schema. No markdown fences, no conversational text.`;

  const result = await executeAiPrompt({
    prompt,
    systemPrompt,
    temperature: 0.3,
    jsonMode: true,
    timeoutMs: options?.timeoutMs ?? 45_000,
    maxOutputTokens: 4096,
  });

  const durationMs = Date.now() - startTime;

  // Clean output and parse JSON
  let cleaned = result.text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // Attempt relaxed parsing or extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`JSON parse error in ${lang}/${chunkKey}: ${err.message}. Raw output preview: ${cleaned.slice(0, 200)}`);
    }
  }

  return {
    lang,
    chunkKey,
    fields: parsed,
    providerUsed: result.providerUsed,
    modelUsed: result.modelUsed,
    durationMs,
  };
}

/** Merges multiple chunk results into a single translation payload */
export function mergeChunkResults(existing: Partial<TourTranslationPayload>, chunk: Partial<TourTranslationPayload>): TourTranslationPayload {
  return {
    title: chunk.title ?? existing.title ?? '',
    description: chunk.description ?? existing.description ?? '',
    cardExcerpt: chunk.cardExcerpt ?? existing.cardExcerpt,
    highlights: chunk.highlights ?? existing.highlights ?? [],
    inclusions: chunk.inclusions ?? existing.inclusions ?? [],
    exclusions: chunk.exclusions ?? existing.exclusions ?? [],
    whatToBring: chunk.whatToBring ?? existing.whatToBring,
    requirements: chunk.requirements ?? existing.requirements,
    cancellationPolicy: chunk.cancellationPolicy ?? existing.cancellationPolicy,
    safetyGuidelines: chunk.safetyGuidelines ?? existing.safetyGuidelines ?? [],
    faqItems: chunk.faqItems ?? existing.faqItems ?? [],
    itinerary: chunk.itinerary ?? existing.itinerary ?? [],
    seoTitle: chunk.seoTitle ?? existing.seoTitle,
    seoDescription: chunk.seoDescription ?? existing.seoDescription,
    keyActivityDetails: chunk.keyActivityDetails ?? existing.keyActivityDetails ?? [],
  };
}
