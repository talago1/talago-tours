import { executeAiPrompt } from '@/lib/ai-router';
import type { TourEditorData, ItineraryMilestone, KeyActivityDetailItem } from '@/types/tourEditor';
import { createDefaultTourEditorData, createDefaultTranslations } from '@/types/tourEditor';

export interface TourCompletenessReport {
  score: number; // 0 to 100
  completedFields: string[];
  missingRequiredFields: string[];
  fieldsNeedingConfirmation: string[];
  inapplicableFields: string[];
}

export type GeneratedTourDraftData = Partial<TourEditorData> & {
  title?: string;
  shortTitle?: string;
  description?: string;
  cardExcerpt?: string;
};

export interface GenerateTourDraftResult {
  success: boolean;
  tourData?: GeneratedTourDraftData;
  reviewRequiredFields: string[];
  completenessReport?: TourCompletenessReport;
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
Your task is to take the user's brief or source material and construct a complete, professional, highly structured tour draft across all supported marketplace sections.

STRICT EDITORIAL & INTEGRITY RULES:
1. ORIGINALITY: If source text from an external travel site is provided, extract ONLY the factual itinerary, stops, activities, and logistics. Write 100% original, evocative, professional marketing copy for TALAGO. Never copy proprietary descriptions verbatim. Never copy image links.
2. PRICING INTEGRITY: NEVER invent or guess tour selling prices. Always set "adultPrice": 0 and "basePriceUSD": 0. The administrator must explicitly set selling prices.
3. OPERATIONAL ACCURACY: Only set realistic duration, pickup times, and inclusions based on the material. If not specified, suggest reasonable standards (e.g. duration 3 to 6 hours; pickupTimes ["08:00", "13:00"]).
4. MULTILINE PRESERVATION: For "whatToBring" and "requirements", provide clear bullet points formatted with newlines (e.g. "- Sunglasses\\n- Sunscreen\\n- Comfortable footwear").
5. ITINERARY: Create 3 to 7 structured milestone objects with "timeTag" (e.g. "08:30" or "Stop 1 - 45 mins"), "title", and detailed "description".
6. ROUTE STOPS: If the tour visits distinct geographic waypoints/locations, generate 2 to 5 route stops with "name" and "durationMinutes".
7. FAQS: Generate 3 to 5 realistic, high-value traveler questions and helpful answers.
8. ACCESSIBILITY & LOGISTICS: Note wheelchair and stroller accessibility realistically based on activity type (e.g., desert quad or scuba = not wheelchair accessible).
9. BOOKING QUESTIONS: If hotel pickup is included, suggest a standard checkout question for hotel name & room number.
10. KEY ACTIVITY DETAILS: Provide 3 to 5 key at-a-glance attributes (e.g., "Group Size", "Live Guide", "Activity Level", "Duration", "Suitable For").
11. LANGUAGE: Output all initial content in clear, engaging English.

YOU MUST RETURN STRICTLY VALID JSON ONLY. No conversational preamble, no markdown fences outside the JSON.

Expected JSON Structure:
{
  "title": "Evocative Tour Title",
  "shortTitle": "Short 2-4 word Title",
  "category": "sea" | "desert" | "historical" | "adventure" | "cultural" | "city" | "family",
  "cardExcerpt": "1-2 punchy sentences summarizing the core experience (max 160 characters).",
  "description": "Full multi-paragraph description highlighting the experience, atmosphere, and what makes it special.",
  "keyActivityDetails": [
    { "title": "Group Size", "value": "Small group (max 12)" },
    { "title": "Live Guide", "value": "English, German" },
    { "title": "Activity Level", "value": "Moderate" }
  ],
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "itinerary": [
    { "timeTag": "08:00", "title": "Hotel Pickup & Transfer", "description": "Air-conditioned transfer from your resort..." },
    { "timeTag": "09:30", "title": "Activity Milestone", "description": "Detailed description of the activity..." }
  ],
  "routePoints": [
    { "name": "Hurghada Marina Departure", "durationMinutes": 30 },
    { "name": "Giftun Island National Park", "durationMinutes": 120 }
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
  "pickupType": "hotel" | "meeting_point",
  "meetingPointName": "Designated meeting point name (if applicable)",
  "meetingPointInstructions": "How to get there / check-in instructions",
  "instantConfirmation": true,
  "freeCancellationHours": 24,
  "cancellationPolicy": "Cancel up to 24 hours in advance for a full refund. No refunds for cancellations made within 24 hours of departure.",
  "childAllowed": true,
  "childMinAge": 4,
  "childMaxAge": 11,
  "infantAllowed": false,
  "minAge": 6,
  "wheelchairAccessible": false,
  "strollerAccessible": false,
  "accessibilityNotes": "Notes on mobility and terrain.",
  "vehicleType": "Air-conditioned modern minivan / transport vehicle",
  "cutoffHours": 12,
  "maxCapacity": 20,
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
    const shortTitle = String(parsed.shortTitle || title.slice(0, 32)).trim();
    const slug = slugify(title);

    const cardExcerpt = String(parsed.cardExcerpt || '').trim();
    const description = String(parsed.description || '').trim();

    // Parse key activity details
    const keyActivityDetails: KeyActivityDetailItem[] = Array.isArray(parsed.keyActivityDetails)
      ? parsed.keyActivityDetails
          .map((k: any, idx: number) => ({
            id: `kad-${Date.now()}-${idx}`,
            title: String(k.title || '').trim(),
            value: String(k.value || '').trim(),
          }))
          .filter((k: any) => k.title && k.value)
      : [];

    // Merge into English translation
    translations.en = {
      ...translations.en,
      title,
      shortTitle,
      cardExcerpt,
      description,
      keyActivityDetails,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String) : [],
      inclusions: Array.isArray(parsed.inclusions) ? parsed.inclusions.map(String) : [],
      exclusions: Array.isArray(parsed.exclusions) ? parsed.exclusions.map(String) : [],
      whatToBring: String(parsed.whatToBring || '').trim(),
      requirements: String(parsed.requirements || '').trim(),
      cancellationPolicy: String(parsed.cancellationPolicy || '').trim(),
      safetyGuidelines: Array.isArray(parsed.safetyGuidelines) ? parsed.safetyGuidelines.map(String) : [],
      seoTitle: String(parsed.metaTitle || title).trim(),
      seoDescription: String(parsed.metaDescription || cardExcerpt || '').trim(),
      accessibilityNotes: String(parsed.accessibilityNotes || '').trim(),
      meetingPointInstructions: String(parsed.meetingPointInstructions || '').trim(),
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

    // Format route points
    const routePoints = Array.isArray(parsed.routePoints)
      ? parsed.routePoints.map((rp: any, idx: number) => ({
          id: `ai-rp-${Date.now()}-${idx}`,
          name: String(rp.name || `Waypoint ${idx + 1}`).trim(),
          description: rp.description ? String(rp.description).trim() : undefined,
          durationMinutes: Number(rp.durationMinutes) || undefined,
          order: idx,
        }))
      : [];

    const hotelPickup = parsed.hotelPickupIncluded !== false;

    // Standard booking questions if hotel pickup is included
    const bookingQuestions = hotelPickup
      ? [
          {
            id: `bq-${Date.now()}-hotel`,
            question: 'Hotel Name & Room Number for Pickup',
            type: 'text' as const,
            required: true,
            placeholder: 'e.g. Steigenberger ALDAU Resort, Room 412',
            helpText: 'Our tour dispatch will confirm exact lobby departure time via WhatsApp.',
          },
        ]
      : [];

    const generatedDraft: GeneratedTourDraftData = {
      ...base,
      title,
      shortTitle,
      description,
      cardExcerpt,
      slug,
      category: String(parsed.category || 'adventure').toLowerCase(),
      keyActivityDetails,
      adultPrice: 0, // Explicitly 0 for admin review
      basePriceUSD: 0,
      durationHours: Number(parsed.durationHours) || 4,
      pickupTimes: Array.isArray(parsed.pickupTimes) && parsed.pickupTimes.length > 0 ? parsed.pickupTimes.map(String) : ['08:00'],
      hotelPickupIncluded: hotelPickup,
      pickupType: hotelPickup ? 'hotel' : 'meeting_point',
      meetingPointName: parsed.meetingPointName ? String(parsed.meetingPointName).trim() : undefined,
      meetingPointInstructions: parsed.meetingPointInstructions ? String(parsed.meetingPointInstructions).trim() : undefined,
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
      routeStops: routePoints,
      faqItems: translations.en.faqItems,
      metaTitle: translations.en.seoTitle,
      metaDescription: translations.en.seoDescription,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
      ageRestrictionsNotes: parsed.ageRestrictionsNotes ? String(parsed.ageRestrictionsNotes).trim() : undefined,
      childMinAge: parsed.childMinAge ? Number(parsed.childMinAge) : 4,
      childMaxAge: parsed.childMaxAge ? Number(parsed.childMaxAge) : 11,
      infantMinAge: 0,
      infantMaxAge: 2,
      wheelchairAccessible: Boolean(parsed.wheelchairAccessible),
      strollerAccessible: Boolean(parsed.strollerAccessible),
      accessibilityNotes: translations.en.accessibilityNotes,
      vehicleType: parsed.vehicleType ? String(parsed.vehicleType).trim() : 'Air-conditioned modern vehicle',
      airConditioned: true,
      cutoffHours: Number(parsed.cutoffHours) || 12,
      maxCapacity: Number(parsed.maxCapacity) || 20,
      bookingQuestions,
      translations,
      internalNotes: sourceUrl
        ? `Draft generated via Talago AI from reference source: ${sourceUrl}`
        : 'Draft generated via Talago AI Tour Builder.',
    };

    // Completeness Report Assessment
    const completedFields: string[] = [
      'Title',
      'Short Title',
      'Slug',
      'Category',
      'Card Excerpt',
      'Full Description',
      'Highlights',
      'Itinerary Milestones',
      'Inclusions',
      'Exclusions',
      'What to Bring',
      'Requirements',
      'Safety Guidelines',
      'FAQs',
      'Cancellation Policy',
      'SEO Title & Description',
      'Keywords',
      'Pickup Logistics',
      'Age Restrictions',
      'Accessibility Notes',
      'Vehicle & Transport Details',
    ];

    if (routePoints.length > 0) completedFields.push('Route Stops');
    if (bookingQuestions.length > 0) completedFields.push('Booking Questions');

    const missingRequiredFields: string[] = [
      'adultPrice (Must set commercial ticket price in Step 4 — pricing integrity rule)',
      'coverImage (Select or upload photos in Step 6)',
      'destinationId (Confirm destination assignment in Step 1)',
    ];

    const fieldsNeedingConfirmation: string[] = [
      'pickupTimes (Verify exact departure schedules with local partner)',
      'durationHours (Verify total excursion duration)',
      'maxCapacity (Verify vehicle/boat seat limits)',
    ];

    const inapplicableFields: string[] = [
      'boatType (Non-marine activity)',
      'privatePrice (Shared public tour format)',
    ];

    const completenessReport: TourCompletenessReport = {
      score: Math.round((completedFields.length / (completedFields.length + missingRequiredFields.length)) * 100),
      completedFields,
      missingRequiredFields,
      fieldsNeedingConfirmation,
      inapplicableFields,
    };

    return {
      success: true,
      tourData: generatedDraft,
      reviewRequiredFields: missingRequiredFields,
      completenessReport,
      explanation: parsed.aiExplanation || 'Complete tour draft generated successfully across all applicable marketplace sections.',
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
