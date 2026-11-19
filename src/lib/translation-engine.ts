/**
 * Chunked, adaptive, resumable translation engine for TALAGO.
 * Each request translates ONE language × ONE fine-grained chunk, with automatic token-aware splitting,
 * fallback retry, and exhaustive field completeness tracking.
 * Server-only — never import into client bundle.
 */
import crypto from 'crypto';
import { executeAiPrompt } from '@/lib/ai-router';
import type { TourTranslationPayload } from '@/lib/gemini';
import { getManagedLanguages } from '@/lib/languages';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: translation-engine cannot be imported into client bundle.');
}

export type ChunkKey =
  | 'core'
  | 'overview'
  | 'lists'
  | 'logistics'
  | 'itinerary'
  | 'faq'
  | 'custom';

export const CHUNK_KEYS: ChunkKey[] = [
  'core',
  'overview',
  'lists',
  'logistics',
  'itinerary',
  'faq',
  'custom',
];

export interface ChunkResult {
  lang: string;
  chunkKey: ChunkKey;
  fields: Partial<TourTranslationPayload>;
  providerUsed: string;
  modelUsed: string;
  durationMs: number;
}

/** SHA-256 of the source JSON — used to detect stale jobs and manual edits */
export function computeSourceHash(source: TourTranslationPayload): string {
  return crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex').slice(0, 32);
}

/** Returns only the fields belonging to this chunk */
export function buildChunkPayload(
  source: TourTranslationPayload,
  chunkKey: ChunkKey
): Partial<TourTranslationPayload> {
  switch (chunkKey) {
    case 'core':
      return {
        title: source.title,
        ...(source.shortTitle ? { shortTitle: source.shortTitle } : {}),
        ...(source.cardExcerpt ? { cardExcerpt: source.cardExcerpt } : {}),
        ...(source.seoTitle ? { seoTitle: source.seoTitle } : {}),
        ...(source.seoDescription ? { seoDescription: source.seoDescription } : {}),
      };

    case 'overview':
      return {
        description: source.description || '',
      };

    case 'lists':
      return {
        ...(source.highlights?.length ? { highlights: source.highlights } : {}),
        ...(source.inclusions?.length ? { inclusions: source.inclusions } : {}),
        ...(source.exclusions?.length ? { exclusions: source.exclusions } : {}),
      };

    case 'logistics':
      return {
        ...(source.pickupDescription ? { pickupDescription: source.pickupDescription } : {}),
        ...(source.meetingPointInstructions
          ? { meetingPointInstructions: source.meetingPointInstructions }
          : {}),
        ...(source.meetingPointLandmark ? { meetingPointLandmark: source.meetingPointLandmark } : {}),
        ...(source.whatToBring ? { whatToBring: source.whatToBring } : {}),
        ...(source.importantInfo ? { importantInfo: source.importantInfo } : {}),
        ...(source.safetyGuidelines?.length ? { safetyGuidelines: source.safetyGuidelines } : {}),
        ...(source.requirements ? { requirements: source.requirements } : {}),
        ...(source.accessibilityNotes ? { accessibilityNotes: source.accessibilityNotes } : {}),
        ...(source.mobilityNotes ? { mobilityNotes: source.mobilityNotes } : {}),
        ...(source.cancellationPolicy ? { cancellationPolicy: source.cancellationPolicy } : {}),
        ...(source.cancellationPolicies?.length
          ? { cancellationPolicies: source.cancellationPolicies }
          : {}),
      };

    case 'itinerary':
      return {
        ...(source.itinerary?.length ? { itinerary: source.itinerary } : {}),
      };

    case 'faq':
      return {
        ...(source.faqItems?.length ? { faqItems: source.faqItems } : {}),
      };

    case 'custom':
      return {
        ...(source.keyActivityDetails?.length
          ? { keyActivityDetails: source.keyActivityDetails }
          : {}),
        ...(source.bookingQuestions?.length
          ? { bookingQuestions: source.bookingQuestions }
          : {}),
        ...(source.routeStops?.length ? { routeStops: source.routeStops } : {}),
      };
  }
}

/** Check if a payload actually has translatable content */
export function hasTranslatableContent(payload: Record<string, any>): boolean {
  return Object.keys(payload).some((k) => {
    const val = payload[k];
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') return val.trim().length > 0;
    return Boolean(val);
  });
}

/** Builds strict prompt for LLM */
export function buildChunkPrompt(
  payload: Partial<TourTranslationPayload>,
  chunkKey: ChunkKey,
  langCode: string,
  langDisplayName?: string
): string {
  const targetLanguage = langDisplayName || langCode.toUpperCase();

  return `You are a professional travel copywriter and translator for TALAGO Tours.
Translate the following tourism content into fluent, natural ${targetLanguage} (${langCode}).

CRITICAL GUARDRAIL RULES:
1. Always preserve brand spelling: "TALAGO" must remain "TALAGO".
2. Keep all place names (Hurghada, Cairo, Luxor, Nile, Red Sea, Sharm El Sheikh, Marsa Alam, Giza) recognizable and culturally authentic.
3. NEVER translate internal IDs, numbers, prices, currency symbols, URLs, booleans, or time tags (like "08:00 AM"). Keep them EXACTLY as in source.
4. Maintain luxury, engaging travel tone. Do NOT omit details or summarize.
5. Output strict JSON matching the exact keys and structure of the input.
6. No conversational filler or markdown fences around the JSON object.

SOURCE CONTENT (${chunkKey.toUpperCase()}):
${JSON.stringify(payload, null, 2)}`;
}

/** Translates a single prompt and parses JSON safely */
async function callAiWithJsonParse(
  prompt: string,
  systemPrompt: string,
  timeoutMs: number,
  maxOutputTokens = 4096
): Promise<{ text: string; parsed: any; providerUsed: string; modelUsed: string }> {
  const result = await executeAiPrompt({
    prompt,
    systemPrompt,
    temperature: 0.2,
    jsonMode: true,
    timeoutMs,
    maxOutputTokens,
  });

  let cleaned = result.text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');

  // Guard against upstream plain-text error messages (e.g. "An error occurred...", "Error: ...") or HTML
  if (
    /^(an error|error|internal server error|service unavailable|rate limit|bad gateway)/i.test(cleaned) ||
    cleaned.startsWith('<!DOCTYPE') ||
    cleaned.startsWith('<html')
  ) {
    throw new Error(
      `AI Provider (${result.providerUsed} / ${result.modelUsed}) returned plain-text error: ${cleaned.slice(0, 200)}`
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (err2: any) {
        throw new Error(
          `JSON parse error from ${result.providerUsed}: ${err.message}. Raw: ${cleaned.slice(0, 150)}`
        );
      }
    } else {
      throw new Error(
        `JSON parse error from ${result.providerUsed}: ${err.message}. Raw: ${cleaned.slice(0, 150)}`
      );
    }
  }

  return {
    text: result.text,
    parsed,
    providerUsed: result.providerUsed,
    modelUsed: result.modelUsed,
  };
}

/**
 * Translates a single chunk with adaptive splitting on MAX_TOKENS or large content.
 */
export async function translateChunk(
  source: TourTranslationPayload,
  chunkKey: ChunkKey,
  lang: string,
  langDisplayName?: string,
  options?: { timeoutMs?: number }
): Promise<ChunkResult> {
  const payload = buildChunkPayload(source, chunkKey);

  if (!hasTranslatableContent(payload)) {
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
  const systemPrompt = `You are an expert tourism translator for TALAGO. Output strict JSON only.`;
  const timeout = options?.timeoutMs ?? 50_000;

  // Adaptive sub-chunking for itinerary or FAQs if large
  if (chunkKey === 'itinerary' && (payload.itinerary?.length || 0) > 3) {
    return translateItineraryAdaptively(payload.itinerary!, lang, langDisplayName, timeout, startTime);
  }

  if (chunkKey === 'faq' && (payload.faqItems?.length || 0) > 3) {
    return translateFaqAdaptively(payload.faqItems!, lang, langDisplayName, timeout, startTime);
  }

  // Adaptive splitting for overview if very long (> 1200 characters)
  if (chunkKey === 'overview' && (payload.description?.length || 0) > 1200) {
    return translateDescriptionAdaptively(payload.description!, lang, langDisplayName, timeout, startTime);
  }

  // Normal execution with fallback on MAX_TOKENS
  try {
    const prompt = buildChunkPrompt(payload, chunkKey, lang, langDisplayName);
    const { parsed, providerUsed, modelUsed } = await callAiWithJsonParse(prompt, systemPrompt, timeout);

    return {
      lang,
      chunkKey,
      fields: parsed,
      providerUsed,
      modelUsed,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const isTokenError =
      err.message?.includes('MAX_TOKENS') ||
      err.message?.includes('truncated') ||
      err.message?.includes('JSON parse error');

    // If token limit reached, try adaptive splitting
    if (isTokenError) {
      if (chunkKey === 'overview' && payload.description) {
        return translateDescriptionAdaptively(payload.description, lang, langDisplayName, timeout, startTime);
      }
      if (chunkKey === 'lists') {
        return translateListsAdaptively(payload, lang, langDisplayName, timeout, startTime);
      }
      if (chunkKey === 'itinerary' && payload.itinerary?.length) {
        return translateItineraryAdaptively(payload.itinerary, lang, langDisplayName, timeout, startTime);
      }
      if (chunkKey === 'faq' && payload.faqItems?.length) {
        return translateFaqAdaptively(payload.faqItems, lang, langDisplayName, timeout, startTime);
      }
    }

    throw err;
  }
}

/** Adaptively splits description into paragraphs, translates each, and rejoins */
async function translateDescriptionAdaptively(
  description: string,
  lang: string,
  langDisplayName?: string,
  timeout = 50_000,
  startTime = Date.now()
): Promise<ChunkResult> {
  const paragraphs = description.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  if (paragraphs.length <= 1) {
    // If single giant block, split by sentences
    const sentences = description.match(/[^.!?]+[.!?]+(\s+|$)/g) || [description];
    const half = Math.ceil(sentences.length / 2);
    const part1 = sentences.slice(0, half).join('');
    const part2 = sentences.slice(half).join('');

    const res1 = await callAiWithJsonParse(
      buildChunkPrompt({ description: part1 }, 'overview', lang, langDisplayName),
      'Output strict JSON with description field.',
      timeout
    );
    const res2 = await callAiWithJsonParse(
      buildChunkPrompt({ description: part2 }, 'overview', lang, langDisplayName),
      'Output strict JSON with description field.',
      timeout
    );

    const mergedDesc = `${res1.parsed.description || part1} ${res2.parsed.description || part2}`.trim();
    return {
      lang,
      chunkKey: 'overview',
      fields: { description: mergedDesc },
      providerUsed: `${res1.providerUsed}+${res2.providerUsed}`,
      modelUsed: res1.modelUsed,
      durationMs: Date.now() - startTime,
    };
  }

  // Translate paragraphs in batches of 2
  const translatedParas: string[] = [];
  let lastProvider = 'ai-router';
  let lastModel = 'default';

  for (let i = 0; i < paragraphs.length; i += 2) {
    const batch = paragraphs.slice(i, i + 2).join('\n\n');
    const res = await callAiWithJsonParse(
      buildChunkPrompt({ description: batch }, 'overview', lang, langDisplayName),
      'Output strict JSON with description field.',
      timeout
    );
    translatedParas.push(res.parsed.description || batch);
    lastProvider = res.providerUsed;
    lastModel = res.modelUsed;
  }

  return {
    lang,
    chunkKey: 'overview',
    fields: { description: translatedParas.join('\n\n') },
    providerUsed: lastProvider,
    modelUsed: lastModel,
    durationMs: Date.now() - startTime,
  };
}

/** Adaptively splits lists into smaller array batches */
async function translateListsAdaptively(
  payload: Partial<TourTranslationPayload>,
  lang: string,
  langDisplayName?: string,
  timeout = 50_000,
  startTime = Date.now()
): Promise<ChunkResult> {
  const resHighlights = payload.highlights?.length
    ? await callAiWithJsonParse(
        buildChunkPrompt({ highlights: payload.highlights }, 'lists', lang, langDisplayName),
        'Output strict JSON with highlights.',
        timeout
      )
    : null;

  const resInclusions = payload.inclusions?.length
    ? await callAiWithJsonParse(
        buildChunkPrompt({ inclusions: payload.inclusions }, 'lists', lang, langDisplayName),
        'Output strict JSON with inclusions.',
        timeout
      )
    : null;

  const resExclusions = payload.exclusions?.length
    ? await callAiWithJsonParse(
        buildChunkPrompt({ exclusions: payload.exclusions }, 'lists', lang, langDisplayName),
        'Output strict JSON with exclusions.',
        timeout
      )
    : null;

  return {
    lang,
    chunkKey: 'lists',
    fields: {
      ...(resHighlights?.parsed.highlights ? { highlights: resHighlights.parsed.highlights } : {}),
      ...(resInclusions?.parsed.inclusions ? { inclusions: resInclusions.parsed.inclusions } : {}),
      ...(resExclusions?.parsed.exclusions ? { exclusions: resExclusions.parsed.exclusions } : {}),
    },
    providerUsed: resHighlights?.providerUsed || resInclusions?.providerUsed || 'ai-router',
    modelUsed: resHighlights?.modelUsed || resInclusions?.modelUsed || 'default',
    durationMs: Date.now() - startTime,
  };
}

/** Adaptively splits itinerary into batches of 2 milestones */
async function translateItineraryAdaptively(
  itinerary: Array<{ timeTag?: string; title: string; description: string }>,
  lang: string,
  langDisplayName?: string,
  timeout = 50_000,
  startTime = Date.now()
): Promise<ChunkResult> {
  const translatedItinerary: Array<{ timeTag?: string; title: string; description: string }> = [];
  let lastProvider = 'ai-router';
  let lastModel = 'default';

  for (let i = 0; i < itinerary.length; i += 2) {
    const batch = itinerary.slice(i, i + 2);
    const res = await callAiWithJsonParse(
      buildChunkPrompt({ itinerary: batch }, 'itinerary', lang, langDisplayName),
      'Output strict JSON with itinerary items.',
      timeout
    );
    const items = res.parsed.itinerary || batch;
    translatedItinerary.push(...items);
    lastProvider = res.providerUsed;
    lastModel = res.modelUsed;
  }

  return {
    lang,
    chunkKey: 'itinerary',
    fields: { itinerary: translatedItinerary },
    providerUsed: lastProvider,
    modelUsed: lastModel,
    durationMs: Date.now() - startTime,
  };
}

/** Adaptively splits FAQs into batches of 2 items */
async function translateFaqAdaptively(
  faqItems: Array<{ question: string; answer: string }>,
  lang: string,
  langDisplayName?: string,
  timeout = 50_000,
  startTime = Date.now()
): Promise<ChunkResult> {
  const translatedFaq: Array<{ question: string; answer: string }> = [];
  let lastProvider = 'ai-router';
  let lastModel = 'default';

  for (let i = 0; i < faqItems.length; i += 2) {
    const batch = faqItems.slice(i, i + 2);
    const res = await callAiWithJsonParse(
      buildChunkPrompt({ faqItems: batch }, 'faq', lang, langDisplayName),
      'Output strict JSON with faqItems.',
      timeout
    );
    const items = res.parsed.faqItems || batch;
    translatedFaq.push(...items);
    lastProvider = res.providerUsed;
    lastModel = res.modelUsed;
  }

  return {
    lang,
    chunkKey: 'faq',
    fields: { faqItems: translatedFaq },
    providerUsed: lastProvider,
    modelUsed: lastModel,
    durationMs: Date.now() - startTime,
  };
}

/** Merges multiple chunk results into a single translation payload */
export function mergeChunkResults(
  existing: Partial<TourTranslationPayload>,
  chunk: Partial<TourTranslationPayload>
): TourTranslationPayload {
  return {
    title: chunk.title ?? existing.title ?? '',
    shortTitle: chunk.shortTitle ?? existing.shortTitle,
    description: chunk.description ?? existing.description ?? '',
    cardExcerpt: chunk.cardExcerpt ?? existing.cardExcerpt,
    highlights: chunk.highlights ?? existing.highlights ?? [],
    inclusions: chunk.inclusions ?? existing.inclusions ?? [],
    exclusions: chunk.exclusions ?? existing.exclusions ?? [],
    whatToBring: chunk.whatToBring ?? existing.whatToBring,
    importantInfo: chunk.importantInfo ?? existing.importantInfo,
    pickupDescription: chunk.pickupDescription ?? existing.pickupDescription,
    meetingPointInstructions: chunk.meetingPointInstructions ?? existing.meetingPointInstructions,
    meetingPointLandmark: chunk.meetingPointLandmark ?? existing.meetingPointLandmark,
    safetyGuidelines: chunk.safetyGuidelines ?? existing.safetyGuidelines ?? [],
    requirements: chunk.requirements ?? existing.requirements,
    accessibilityNotes: chunk.accessibilityNotes ?? existing.accessibilityNotes,
    mobilityNotes: chunk.mobilityNotes ?? existing.mobilityNotes,
    cancellationPolicy: chunk.cancellationPolicy ?? existing.cancellationPolicy,
    cancellationPolicies: chunk.cancellationPolicies ?? existing.cancellationPolicies ?? [],
    seoTitle: chunk.seoTitle ?? existing.seoTitle,
    seoDescription: chunk.seoDescription ?? existing.seoDescription,
    faqItems: chunk.faqItems ?? existing.faqItems ?? [],
    itinerary: chunk.itinerary ?? existing.itinerary ?? [],
    keyActivityDetails: chunk.keyActivityDetails ?? existing.keyActivityDetails ?? [],
    bookingQuestions: chunk.bookingQuestions ?? existing.bookingQuestions ?? [],
    routeStops: chunk.routeStops ?? existing.routeStops ?? [],
  };
}

/**
 * EXHAUSTIVE FIELD COMPLETENESS AUDITOR
 * Inspects all applicable source fields and computes exact translation coverage.
 */
export interface FieldCompletenessAudit {
  locale: string;
  totalApplicableFields: number;
  translatedFields: number;
  missingFields: number;
  failedFields: number;
  completionPercent: number;
  isComplete: boolean;
  fieldDetails: Array<{
    key: string;
    label: string;
    hasSource: boolean;
    isTranslated: boolean;
    status: 'COMPLETE' | 'MISSING' | 'EMPTY_SOURCE';
  }>;
}

export function auditTranslationCompleteness(
  source: TourTranslationPayload,
  translated: Partial<TourTranslationPayload> | undefined,
  locale: string
): FieldCompletenessAudit {
  const fields = [
    { key: 'title', label: 'Experience Title', isArray: false },
    { key: 'shortTitle', label: 'Short Title', isArray: false },
    { key: 'cardExcerpt', label: 'Card Excerpt', isArray: false },
    { key: 'description', label: 'Overview / Description', isArray: false },
    { key: 'highlights', label: 'Highlights', isArray: true },
    { key: 'inclusions', label: 'Inclusions', isArray: true },
    { key: 'exclusions', label: 'Exclusions', isArray: true },
    { key: 'whatToBring', label: 'What to Bring', isArray: false },
    { key: 'importantInfo', label: 'Important Information', isArray: false },
    { key: 'pickupDescription', label: 'Pickup Description', isArray: false },
    { key: 'meetingPointInstructions', label: 'Meeting Point Instructions', isArray: false },
    { key: 'meetingPointLandmark', label: 'Meeting Point Landmark', isArray: false },
    { key: 'safetyGuidelines', label: 'Safety Guidelines', isArray: true },
    { key: 'requirements', label: 'Requirements', isArray: false },
    { key: 'accessibilityNotes', label: 'Accessibility Notes', isArray: false },
    { key: 'mobilityNotes', label: 'Mobility Notes', isArray: false },
    { key: 'cancellationPolicy', label: 'Cancellation Policy', isArray: false },
    { key: 'cancellationPolicies', label: 'Cancellation Policies', isArray: true },
    { key: 'seoTitle', label: 'SEO Title', isArray: false },
    { key: 'seoDescription', label: 'SEO Description', isArray: false },
    { key: 'itinerary', label: 'Itinerary Milestones', isArray: true },
    { key: 'faqItems', label: 'FAQ Items', isArray: true },
    { key: 'keyActivityDetails', label: 'Key Activity Details', isArray: true },
    { key: 'bookingQuestions', label: 'Booking Questions', isArray: true },
    { key: 'routeStops', label: 'Route Stops', isArray: true },
  ];

  let totalApplicable = 0;
  let translatedCount = 0;
  const fieldDetails: FieldCompletenessAudit['fieldDetails'] = [];

  for (const f of fields) {
    const srcVal = (source as any)[f.key];
    const transVal = translated ? (translated as any)[f.key] : undefined;

    let hasSource = false;
    if (f.isArray) {
      hasSource = Array.isArray(srcVal) && srcVal.length > 0;
    } else {
      hasSource = typeof srcVal === 'string' && srcVal.trim().length > 0;
    }

    if (!hasSource) {
      fieldDetails.push({
        key: f.key,
        label: f.label,
        hasSource: false,
        isTranslated: false,
        status: 'EMPTY_SOURCE',
      });
      continue;
    }

    totalApplicable++;

    let isTranslated = false;
    if (f.isArray) {
      isTranslated = Array.isArray(transVal) && transVal.length > 0;
    } else {
      isTranslated = typeof transVal === 'string' && transVal.trim().length > 0;
    }

    if (isTranslated) {
      translatedCount++;
      fieldDetails.push({
        key: f.key,
        label: f.label,
        hasSource: true,
        isTranslated: true,
        status: 'COMPLETE',
      });
    } else {
      fieldDetails.push({
        key: f.key,
        label: f.label,
        hasSource: true,
        isTranslated: false,
        status: 'MISSING',
      });
    }
  }

  const missingFields = totalApplicable - translatedCount;
  const completionPercent = totalApplicable > 0 ? Math.round((translatedCount / totalApplicable) * 100) : 100;
  const isComplete = totalApplicable > 0 && missingFields === 0;

  return {
    locale,
    totalApplicableFields: totalApplicable,
    translatedFields: translatedCount,
    missingFields,
    failedFields: 0,
    completionPercent,
    isComplete,
    fieldDetails,
  };
}
