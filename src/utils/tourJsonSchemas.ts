import { z } from 'zod';

// Safe UUID generator helper for environments where crypto.randomUUID might not be available
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ---------------------------------------------------------------------------
// Itinerary Step Schema
// ---------------------------------------------------------------------------
export const ItineraryStepSchema = z.object({
  id: z.string().default(() => generateUUID()),
  timeTag: z.string().catch(''),
  activity: z.string().catch(''),
  inclusions: z.string().catch(''),
  // Legacy / alternate key compatibility
  time: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  checklist: z.array(z.string()).catch([]),
  location: z.string().catch(''),
});

export type ItineraryStep = z.infer<typeof ItineraryStepSchema>;

export function safeParseItinerary(value: unknown): ItineraryStep[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  const parsed = z.array(ItineraryStepSchema).safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Seeded Review Schema
// ---------------------------------------------------------------------------
export const SeededReviewSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().catch('Verified Guest'),
  rating: z.number().catch(5),
  comment: z.string().catch(''),
  status: z.string().catch('APPROVED'),
  createdAt: z.string().optional(),
});

export type SeededReview = z.infer<typeof SeededReviewSchema>;

export function safeParseReviews(value: unknown): SeededReview[] {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  const parsed = z.array(SeededReviewSchema).safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Tour Translation Schema
// ---------------------------------------------------------------------------
export const TourTranslationSchema = z.object({
  title: z.string().catch(''),
  description: z.string().catch(''),
  cancellationPolicies: z.array(z.string()).catch([]),
  highlights: z.array(z.string()).catch([]),
  inclusions: z.array(z.string()).catch([]),
  exclusions: z.array(z.string()).catch([]),
  cardExcerpt: z.string().catch(''),
  whatToBring: z.string().catch(''),
  pickupDescription: z.string().catch(''),
  cancellationPolicy: z.string().catch(''),
});

export type TourTranslation = z.infer<typeof TourTranslationSchema>;

export const TourTranslationsRecordSchema = z.record(z.string(), TourTranslationSchema);

export function safeParseTranslations(value: unknown): Record<string, TourTranslation> {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const parsed = TourTranslationsRecordSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return {};
}
