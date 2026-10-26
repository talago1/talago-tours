/**
 * Google Gemini AI client for TALAGO
 * Features:
 *  1. AI Auto-Translation of tours across 8 languages
 *  2. AI Article / Blog Post generation for destinations & experiences
 *
 * Uses free-tier Google Gemini 1.5 Flash via REST API.
 *
 * Key Pool & Dynamic Failover:
 *  - Reads GEMINI_API_KEY (primary) + GEMINI_API_KEY_2 … GEMINI_API_KEY_10 from env.
 *  - Round-robins across all configured keys.
 *  - On 429 (rate-limit) or 5xx, marks the key as temporarily exhausted and
 *    immediately retries with the next available key.
 *  - Exhausted keys re-enter the pool after COOLDOWN_MS (default: 60 s).
 */

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Gemini AI utility imported into browser bundle.');
}

// ---------------------------------------------------------------------------
// Key Pool
// ---------------------------------------------------------------------------

const GEMINI_API_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const COOLDOWN_MS = 60_000; // 60 seconds before a rate-limited key is retried

interface PoolKey {
  key: string;
  exhaustedUntil: number; // epoch ms; 0 = available
}

let _pool: PoolKey[] | null = null;

function buildPool(): PoolKey[] {
  const keys: string[] = [];

  // Primary key
  const primary = process.env.GEMINI_API_KEY?.trim();
  if (primary) keys.push(primary);

  // Additional keys GEMINI_API_KEY_2 … GEMINI_API_KEY_10
  for (let i = 2; i <= 10; i++) {
    const extra = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (extra) keys.push(extra);
  }

  return keys.map((key) => ({ key, exhaustedUntil: 0 }));
}

function getPool(): PoolKey[] {
  if (!_pool) _pool = buildPool();
  return _pool;
}

let _roundRobinIndex = 0;

/** Returns the next available key from the pool, or null if all are exhausted. */
function pickKey(): PoolKey | null {
  const pool = getPool();
  if (pool.length === 0) return null;

  const now = Date.now();
  for (let attempt = 0; attempt < pool.length; attempt++) {
    const idx = (_roundRobinIndex + attempt) % pool.length;
    const entry = pool[idx];
    if (entry.exhaustedUntil === 0 || now >= entry.exhaustedUntil) {
      entry.exhaustedUntil = 0; // reset if cooldown has passed
      _roundRobinIndex = (idx + 1) % pool.length;
      return entry;
    }
  }
  return null; // all exhausted
}

function markExhausted(poolKey: PoolKey) {
  poolKey.exhaustedUntil = Date.now() + COOLDOWN_MS;
  console.warn(`[gemini] Key ...${poolKey.key.slice(-6)} rate-limited. Cooling down for ${COOLDOWN_MS / 1000}s.`);
}

// ---------------------------------------------------------------------------
// Public helpers (backward-compatible)
// ---------------------------------------------------------------------------

export function getGeminiApiKey(): string | null {
  return getPool()[0]?.key ?? null;
}

export function isGeminiConfigured(): boolean {
  return getPool().length > 0;
}

export async function isAiConfigured(): Promise<boolean> {
  if (getPool().length > 0) return true;
  try {
    const { getAiProviders } = await import('@/lib/ai-router');
    const providers = await getAiProviders(true);
    return providers.some((p) => p.isActive);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Core fetch with failover
// ---------------------------------------------------------------------------

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

async function callGemini(prompt: string, jsonMode = true): Promise<string> {
  // 1. Try Universal AI Router pool (Gemini, Groq, OpenRouter, DeepSeek)
  try {
    const { executeAiPrompt } = await import('@/lib/ai-router');
    const result = await executeAiPrompt({
      prompt,
      jsonMode,
      temperature: 0.2,
    });
    if (result.text && result.text.trim()) {
      return result.text.trim();
    }
  } catch (routerErr) {
    console.warn('[gemini] Universal AI Router failed or empty, using native pool fallback:', routerErr);
  }

  // 2. Direct fallback using built-in Gemini key pool
  const pool = getPool();
  if (pool.length === 0) {
    throw new Error('No AI provider or GEMINI_API_KEY configured.');
  }

  let lastError: Error = new Error('All Gemini API keys are exhausted or unavailable.');

  for (let attempt = 0; attempt < pool.length; attempt++) {
    const entry = pickKey();
    if (!entry) {
      // All keys in cooldown - brief wait then try first key anyway
      await new Promise((r) => setTimeout(r, 2000));
      const fallback = pool[0];
      fallback.exhaustedUntil = 0;
      const url = `${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(fallback.key)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      });
      if (!response.ok) throw lastError;
      const data = (await response.json()) as GeminiResponse;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Gemini AI returned empty response');
      return rawText;
    }

    const url = `${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(entry.key)}`;

    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      lastError = networkErr instanceof Error ? networkErr : new Error(String(networkErr));
      markExhausted(entry);
      continue;
    }

    // Rate limit or server error → mark key and try next
    if (response.status === 429 || response.status >= 500) {
      const errorBody = (await response.json().catch(() => null)) as GeminiResponse | null;
      const msg = errorBody?.error?.message || `Gemini API status ${response.status}`;
      lastError = new Error(`Gemini AI Error (key ...${entry.key.slice(-6)}): ${msg}`);
      markExhausted(entry);
      continue;
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as GeminiResponse | null;
      const msg = errorBody?.error?.message || `Gemini API returned status ${response.status}`;
      throw new Error(`Gemini AI Error: ${msg}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Gemini AI returned empty response');

    return rawText;
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// 1. Tour Auto-Translation
// ---------------------------------------------------------------------------

export interface TourTranslationPayload {
  title: string;
  description: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  whatToBring?: string;
  requirements?: string;
  cancellationPolicy?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  itinerary?: Array<{ timeTag?: string; title: string; description: string }>;
}

export type SupportedLanguage = 'de' | 'ru' | 'fr' | 'it' | 'pl' | 'es' | 'uk';

export interface AiContentPageBlock {
  heading: string;
  body: string;
  kind: 'TEXT' | 'FAQ';
}

export interface AiContentPage {
  title: string;
  intro: string;
  blocks: AiContentPageBlock[];
}

export async function generateContentPage(promptBrief: string, pageLabel: string): Promise<AiContentPage> {
  const prompt = `You write trustworthy, clear website content for TALAGO, a multilingual tourism marketplace connecting travellers with vetted independent local operators. Generate the ${pageLabel} page based on this brief/example: "${promptBrief}".

Return only valid JSON with this exact shape:
{"title":"short page title","intro":"concise introduction","blocks":[{"heading":"section heading","body":"useful paragraph text","kind":"TEXT"}]}

Use 3 to 8 blocks. Use kind "FAQ" only when the block is a question and answer. Do not invent legal guarantees, prices, operators, or unsupported certifications.`;
  const rawJson = await callGemini(prompt, true);
  return JSON.parse(rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()) as AiContentPage;
}

export async function translateContentPage(source: AiContentPage, targetLangs: SupportedLanguage[]): Promise<Record<SupportedLanguage, AiContentPage>> {
  const prompt = `Translate this TALAGO tourism marketplace content into these languages: ${targetLangs.join(', ')}. Preserve the meaning, block order, block kind, and clear customer-friendly tone. Return only valid JSON keyed by language code. Each value must have title, intro, and blocks with heading, body, and kind.

Source English content:
${JSON.stringify(source, null, 2)}`;
  const rawJson = await callGemini(prompt, true);
  return JSON.parse(rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()) as Record<SupportedLanguage, AiContentPage>;
}

export async function translateSingleLanguage(source: AiContentPage, targetLang: SupportedLanguage): Promise<AiContentPage> {
  const prompt = `Translate this TALAGO tourism marketplace content into ${targetLang}. Preserve the meaning, block order, block kind, and natural tone for native speakers. Return only valid JSON with title, intro, and blocks array of {heading, body, kind}.

Source English content:
${JSON.stringify(source, null, 2)}`;
  const rawJson = await callGemini(prompt, true);
  return JSON.parse(rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()) as AiContentPage;
}

export async function generateContentFaqs(pageTitle: string, intro: string): Promise<AiContentPageBlock[]> {
  const prompt = `You write clear, helpful FAQs for TALAGO tourism marketplace for a page titled "${pageTitle}" with intro: "${intro}".
Generate 3 to 5 relevant, realistic questions and answers for travellers.
Return strictly valid JSON array of objects:
[
  { "heading": "Clear Question?", "body": "Clear, practical answer.", "kind": "FAQ" }
]`;
  const rawJson = await callGemini(prompt, true);
  return JSON.parse(rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()) as AiContentPageBlock[];
}

export async function rewriteContentBlock(text: string, mode: 'rewrite' | 'shorten' | 'expand'): Promise<string> {
  const instruction = mode === 'shorten'
    ? 'Make this content more concise and punchy while retaining all factual clarity.'
    : mode === 'expand'
      ? 'Expand this content with helpful details and a warm, professional, trustworthy marketplace tone.'
      : 'Rewrite and polish this content to make it clear, engaging, and professional for tourists.';

  const prompt = `You are an expert editorial writer for TALAGO tourism marketplace. ${instruction}
Original text:
"${text}"

Return only the revised text paragraph. Do not include markdown fences, quotes, or conversational preamble.`;
  const result = await callGemini(prompt, false);
  return result.replace(/^["']|["']$/g, '').trim();
}

export async function translateTourContent(
  source: TourTranslationPayload,
  targetLangs: SupportedLanguage[] = ['de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'],
): Promise<Record<SupportedLanguage, Partial<TourTranslationPayload>>> {
  const prompt = `You are a professional travel localization expert for luxury travel platform TALAGO.
Translate the following tourism experience data from English into the specified target languages: ${targetLangs.join(', ')}.

Maintain professional, compelling, and localized tone suitable for tourists. Do not invent facts, keep specific names (landmarks, beaches, equipment) accurate.

Return a JSON object where keys are the language codes (${targetLangs.join(', ')}), and each value has the matching translated structure:
{
  "title": string,
  "description": string,
  "highlights": string[],
  "inclusions": string[],
  "exclusions": string[],
  "whatToBring": string,
  "requirements": string,
  "cancellationPolicy": string,
  "faqItems": [{"question": string, "answer": string}],
  "itinerary": [{"timeTag": string, "title": string, "description": string}]
}

Input English data:
${JSON.stringify(source, null, 2)}
`;

  const rawJson = await callGemini(prompt, true);
  try {
    return JSON.parse(rawJson);
  } catch {
    const cleaned = rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  }
}

// ---------------------------------------------------------------------------
// 2. AI Blog Article Generator
// ---------------------------------------------------------------------------

export interface GenerateBlogParams {
  topic: string;
  destinationName?: string;
  category?: string;
}

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Markdown formatted
  category: string;
  tags: string[];
  readTimeMinutes: number;
  translations: Record<
    SupportedLanguage,
    {
      title: string;
      excerpt: string;
      content: string;
    }
  >;
}

export async function generateAiBlogPost(
  params: GenerateBlogParams,
): Promise<GeneratedBlogPost> {
  const { topic, destinationName = 'Egypt', category = 'Travel Guide' } = params;

  const prompt = `You are an expert travel journalist, SEO strategist, and editorial copywriter for TALAGO, a premier tourism and experience booking platform.

Write an in-depth, captivating, high-ranking SEO travel guide about: "${topic}" (Destination: ${destinationName}, Category: ${category}).

Requirements:
1. "title": Catchy, SEO-optimized English headline (under 65 chars).
2. "slug": Clean url-friendly slug (e.g. "top-things-to-do-in-hurghada").
3. "excerpt": Engaging 2-sentence summary hook.
4. "content": High quality, structured Markdown article (at least 600 words) with:
   - ## Key Highlights & Overview
   - ## Best Time to Visit & Logistics
   - ## Top Experiences & Must-See Sights
   - ## Insider Tips for Travelers
   - Mention booking vetted tours with local guides via TALAGO.
5. "category": "${category}".
6. "tags": 4 to 6 relevant tags.
7. "readTimeMinutes": estimated read time (int).
8. "translations": Multi-language translations for "de", "ru", "fr", "it", "pl", "es", "uk" each with { "title": string, "excerpt": string, "content": string (full translated markdown) }.

Return strictly valid JSON adhering to this schema:
{
  "title": string,
  "slug": string,
  "excerpt": string,
  "content": string,
  "category": string,
  "tags": string[],
  "readTimeMinutes": number,
  "translations": {
    "de": { "title": string, "excerpt": string, "content": string },
    "ru": { "title": string, "excerpt": string, "content": string },
    "fr": { "title": string, "excerpt": string, "content": string },
    "it": { "title": string, "excerpt": string, "content": string },
    "pl": { "title": string, "excerpt": string, "content": string },
    "es": { "title": string, "excerpt": string, "content": string },
    "uk": { "title": string, "excerpt": string, "content": string }
  }
}
`;

  const rawJson = await callGemini(prompt, true);
  try {
    return JSON.parse(rawJson);
  } catch {
    const cleaned = rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  }
}



