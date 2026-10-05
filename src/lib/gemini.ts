/**
 * Google Gemini AI client for TALAGO
 * Used for:
 * 1. AI Auto-Translation of tours across 8 languages
 * 2. AI Article / Blog Post generation for destinations & experiences
 *
 * Uses free-tier Google Gemini 1.5 Flash via REST API (zero extra dependencies).
 * Configure GEMINI_API_KEY in .env.
 */

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

const GEMINI_API_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

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
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const url = `${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as GeminiResponse | null;
    const msg = errorBody?.error?.message || `Gemini API returned status ${response.status}`;
    throw new Error(`Gemini AI Error: ${msg}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini AI returned empty response');
  }

  return rawText;
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

export async function translateTourContent(
  source: TourTranslationPayload,
  targetLangs: SupportedLanguage[] = ['de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'],
): Promise<Record<SupportedLanguage, Partial<TourTranslationPayload>>> {
  const prompt = `You are a professional travel localization expert for luxury travel platform TALAGO.
Translate the following tourism experience data from English into the specified target languages: ${targetLangs.join(
    ', ',
  )}.

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
    const parsed = JSON.parse(rawJson);
    return parsed;
  } catch {
    // If wrapped in code block
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
