import { executeAiPrompt } from '@/lib/ai-router';
import type { TourEditorData, ItineraryMilestone } from '@/types/tourEditor';
import { createDefaultTourEditorData, createDefaultTranslations } from '@/types/tourEditor';

export interface GenerateTourDraftResult {
  success: boolean;
  tourData?: Partial<TourEditorData>;
  reviewRequiredFields: string[];
  explanation?: string;
  sourceUrl?: string;
  error?: string;
  blocked?: boolean;
}

export interface UrlFetchResult {
  success: boolean;
  text?: string;
  title?: string;
  sourceUrl?: string;
  error?: string;
  blocked?: boolean;
}

/**
 * Checks if a hostname or IP is an internal/loopback address to prevent SSRF.
 */
function isDisallowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '169.254.169.254' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  // Disallow private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const ipMatch = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 0) return true;
  }
  return false;
}

/**
 * Fetches an external URL server-side and strips HTML to plain content.
 * Gracefully handles bot blocks, Cloudflare gates, or timeouts.
 */
export async function fetchAndExtractUrlContent(rawUrl: string): Promise<UrlFetchResult> {
  let parsedUrl: URL;
  try {
    let clean = rawUrl.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    parsedUrl = new URL(clean);
  } catch {
    return {
      success: false,
      error: 'Invalid URL format. Please provide a valid web address.',
    };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      success: false,
      error: 'Only HTTP and HTTPS URLs are supported.',
    };
  }

  if (isDisallowedHost(parsedUrl.hostname)) {
    return {
      success: false,
      error: 'Access to internal or loopback network addresses is prohibited.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 403 || response.status === 401 || response.status === 429) {
      return {
        success: false,
        blocked: true,
        error:
          'Access to this website was restricted (HTTP ' +
          response.status +
          '). The provider prevents automated fetching. Please copy and paste the tour text directly into the AI prompt.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL (HTTP ${response.status} ${response.statusText}).`,
      };
    }

    const html = await response.text();

    // Check for Cloudflare / anti-bot challenge signatures
    if (
      html.includes('cf-turnstile') ||
      html.includes('cf-browser-verification') ||
      html.includes('Attention Required! | Cloudflare') ||
      html.includes('Just a moment...') ||
      html.includes('challenge-running') ||
      html.includes('Ray ID:')
    ) {
      return {
        success: false,
        blocked: true,
        error:
          'The external page is protected by a Cloudflare / anti-bot verification challenge. Automated reading is not allowed. Please copy the text from your browser and paste it into the prompt.',
      };
    }

    // Extract title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : undefined;

    // Strip heavy non-content tags
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\r?\n\s*\r?\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Limit text to 12,000 characters to keep prompt tightly focused
    if (cleaned.length > 12000) {
      cleaned = cleaned.slice(0, 12000) + '... [truncated]';
    }

    if (cleaned.length < 80) {
      return {
        success: false,
        error: 'The fetched page did not contain sufficient readable text to extract a tour.',
      };
    }

    return {
      success: true,
      text: cleaned,
      title: extractedTitle,
      sourceUrl: parsedUrl.toString(),
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Connection timed out while fetching the external page (12s limit).',
      };
    }
    return {
      success: false,
      error: `Could not reach external URL: ${err.message || 'Network error'}`,
    };
  }
}

/**
 * Creates a clean kebab-case URL slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a complete tour draft using the active AI Router.
 */
export async function generateTourDraft({
  prompt,
  sourceText,
  sourceUrl,
  destinationName,
  category,
}: {
  prompt?: string;
  sourceText?: string;
  sourceUrl?: string;
  destinationName?: string;
  category?: string;
}): Promise<GenerateTourDraftResult> {
  const combinedInput = [
    prompt ? `ADMINISTRATOR BRIEF / REQUEST:\n${prompt}` : '',
    destinationName ? `TARGET DESTINATION: ${destinationName}` : '',
    category ? `TARGET CATEGORY: ${category}` : '',
    sourceUrl ? `SOURCE REFERENCE URL: ${sourceUrl}` : '',
    sourceText ? `SOURCE FACTUAL MATERIAL:\n${sourceText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (!combinedInput.trim()) {
    return {
      success: false,
      reviewRequiredFields: [],
      error: 'No prompt or source text provided for AI generation.',
    };
  }

  const systemPrompt = `You are an expert luxury, adventure, and cultural tourism curator for TALAGO Experiences (an Egyptian marketplace for vetted local tours).
Your task is to take the user's brief or source material and construct a complete, professional, highly structured tour draft.

STRICT EDITORIAL & INTEGRITY RULES:
1. ORIGINALITY: If source text from an external travel site is provided, extract ONLY the factual itinerary, stops, activities, and logistics. Write 100% original, evocative, professional marketing copy for TALAGO. Never copy proprietary descriptions verbatim. Never copy image links.
2. PRICING INTEGRITY: NEVER invent or guess tour selling prices. Always set "adultPrice": 0 and "basePriceUSD": 0. The administrator must explicitly set selling prices.
3. OPERATIONAL ACCURACY: Only set realistic duration, pickup times, and inclusions based on the material. If not specified, suggest reasonable standards (e.g. duration 3 to 6 hours; pickupTimes ["08:00", "13:00"]).
4. MULTILINE PRESERVATION: For "whatToBring" and "requirements", provide clear bullet points formatted with newlines (e.g. "- Sunglasses\\n- Sunscreen\\n- Comfortable footwear").
5. ITINERARY: Create 3 to 7 structured milestone objects with "timeTag" (e.g. "08:30" or "Stop 1 - 45 mins"), "title", and detailed "description".
6. FAQS: Generate 3 to 5 realistic, high-value traveler questions and helpful answers.
7. LANGUAGE: Output all initial content in clear, engaging English.

YOU MUST RETURN STRICTLY VALID JSON ONLY. No conversational preamble, no markdown fences outside the JSON.

Expected JSON Structure:
{
  "title": "Evocative Tour Title",
  "category": "sea" | "desert" | "historical" | "adventure" | "cultural" | "city" | "family",
  "cardExcerpt": "1-2 punchy sentences summarizing the core experience (max 160 characters).",
  "description": "Full multi-paragraph description highlighting the experience, atmosphere, and what makes it special.",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "itinerary": [
    { "timeTag": "08:00", "title": "Hotel Pickup & Transfer", "description": "Air-conditioned transfer from your resort..." },
    { "timeTag": "09:30", "title": "Activity Milestone", "description": "Detailed description of the activity..." }
  ],
  "inclusions": ["Included item 1", "Included item 2", "Included item 3", "Included item 4"],
  "exclusions": ["Excluded item 1", "Excluded item 2", "Excluded item 3"],
  "whatToBring": "- Item 1\\n- Item 2\\n- Item 3",
  "requirements": "- Minimum age 16 for quad drivers\\n- Moderate physical fitness",
  "safetyGuidelines": ["Safety helmet provided and mandatory", "Briefing before departure"],
  "faqItems": [
    { "question": "Are hotel transfers included?", "answer": "Yes, round-trip transfers from selected hotels are included." }
  ],
  "durationHours": 4,
  "pickupTimes": ["08:00", "13:30"],
  "hotelPickupIncluded": true,
  "instantConfirmation": true,
  "freeCancellationHours": 24,
  "cancellationPolicy": "Cancel up to 24 hours in advance for a full refund. No refunds for cancellations made within 24 hours of departure.",
  "metaTitle": "SEO Page Title (50-60 characters)",
  "metaDescription": "SEO Meta Description (140-160 characters)",
  "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "ageRestrictionsNotes": "Suitable for ages 6 and older; quad drivers must be 16+",
  "aiExplanation": "Brief note to the admin on how this tour was structured and what fields need their attention."
}`;

  try {
    const aiResult = await executeAiPrompt({
      prompt: combinedInput,
      systemPrompt,
      temperature: 0.3,
      jsonMode: true,
    });

    const rawText = aiResult.text.trim();
    const cleanJson = rawText
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Build default tour data structure and merge AI fields
    const base = createDefaultTourEditorData();
    const translations = createDefaultTranslations();

    const title = String(parsed.title || 'Untitled Tour Experience').trim();
    const slug = slugify(title);

    // Merge into English translation
    translations.en = {
      ...translations.en,
      title,
      cardExcerpt: String(parsed.cardExcerpt || '').trim(),
      description: String(parsed.description || '').trim(),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [],
      inclusions: Array.isArray(parsed.inclusions) ? parsed.inclusions.map(String) : [],
      exclusions: Array.isArray(parsed.exclusions) ? parsed.exclusions.map(String) : [],
      whatToBring: String(parsed.whatToBring || '').trim(),
      requirements: String(parsed.requirements || '').trim(),
      cancellationPolicy: String(parsed.cancellationPolicy || '').trim(),
      safetyGuidelines: Array.isArray(parsed.safetyGuidelines) ? parsed.safetyGuidelines.map(String) : [],
      seoTitle: String(parsed.metaTitle || title).trim(),
      seoDescription: String(parsed.metaDescription || parsed.cardExcerpt || '').trim(),
      faqItems: Array.isArray(parsed.faqItems)
        ? parsed.faqItems.map((f: any) => ({
            question: String(f.question || '').trim(),
            answer: String(f.answer || '').trim(),
          }))
        : [],
    };

    // Format itinerary milestones
    const itineraryMilestones: ItineraryMilestone[] = Array.isArray(parsed.itinerary)
      ? parsed.itinerary.map((m: any, idx: number) => ({
          id: `ai-milestone-${Date.now()}-${idx}`,
          timeTag: String(m.timeTag || m.time || `0${idx + 8}:00`),
          iconToken: 'compass' as const,
          title: {
            en: String(m.title || `Stop ${idx + 1}`),
          },
          description: {
            en: String(m.description || ''),
          },
        }))
      : [];

    const generatedDraft: Partial<TourEditorData> = {
      ...base,
      slug,
      category: String(parsed.category || 'adventure').toLowerCase(),
      adultPrice: 0, // Explicitly 0 for admin review
      basePriceUSD: 0,
      durationHours: Number(parsed.durationHours) || 4,
      pickupTimes: Array.isArray(parsed.pickupTimes) && parsed.pickupTimes.length > 0 ? parsed.pickupTimes.map(String) : ['08:00'],
      hotelPickupIncluded: parsed.hotelPickupIncluded !== false,
      pickupType: parsed.hotelPickupIncluded !== false ? 'hotel' : 'meeting_point',
      instantConfirmation: parsed.instantConfirmation !== false,
      freeCancellationHours: Number(parsed.freeCancellationHours) || 24,
      cancellationPolicy: String(parsed.cancellationPolicy || '').trim(),
      highlights: translations.en.highlights,
      inclusions: translations.en.inclusions,
      exclusions: translations.en.exclusions,
      whatToBring: translations.en.whatToBring,
      requirements: translations.en.requirements,
      safetyGuidelines: translations.en.safetyGuidelines,
      itinerary: itineraryMilestones,
      faqItems: translations.en.faqItems,
      metaTitle: translations.en.seoTitle,
      metaDescription: translations.en.seoDescription,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
      ageRestrictionsNotes: parsed.ageRestrictionsNotes ? String(parsed.ageRestrictionsNotes).trim() : undefined,
      translations,
      internalNotes: sourceUrl
        ? `Draft generated via Talago AI from reference source: ${sourceUrl}`
        : 'Draft generated via Talago AI Tour Builder.',
    };

    // Fields that require explicit human review
    const reviewRequiredFields = [
      'adultPrice (Must set commercial ticket price in Step 4)',
      'coverImage (Select or upload photos in Step 6)',
      'destinationId (Confirm destination assignment in Step 1)',
      'pickupTimes (Verify exact departure schedule in Step 5)',
    ];

    return {
      success: true,
      tourData: generatedDraft,
      reviewRequiredFields,
      explanation: parsed.aiExplanation || 'Complete tour draft generated successfully with full schema mappings.',
      sourceUrl,
    };
  } catch (err: any) {
    console.error('[ai-tour-generator] Generation error:', err);
    return {
      success: false,
      reviewRequiredFields: [],
      error: `AI Tour Generation failed: ${err.message || 'Unknown error'}`,
    };
  }
}
