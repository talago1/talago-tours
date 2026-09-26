import { z } from 'zod';

// Safe UUID generator helper for environments where crypto.randomUUID might not be available
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ---------------------------------------------------------------------------
// Itinerary Step Schema (v2 — additive, all new fields optional)
// ---------------------------------------------------------------------------
export const ItineraryStepSchema = z.object({
  id: z.string().default(() => generateUUID()),
  timeTag: z.string().catch('').default(''),
  activity: z.string().catch('').default(''),
  inclusions: z.string().catch('').default(''),
  time: z.string().optional(),
  title: z.union([z.string(), z.record(z.string(), z.string()), z.any()]).optional(),
  iconToken: z.string().optional(),
  // v2 additions
  description: z.record(z.string(), z.string()).optional(),
  durationMinutes: z.number().nonnegative().optional(),
  location: z.string().catch('').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pointType: z
    .enum(['DEPARTURE', 'STOP', 'ACTIVITY', 'MEAL', 'ARRIVAL', 'TRANSFER'])
    .optional(),
  _v: z.number().optional(),
  // legacy fields
  checklist: z.array(z.string()).catch([]).default([]),
}).passthrough();

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
// Covers all fields defined in LocalizedTourContent (UnifiedTourEditor / tourEditor.ts)
// Uses .passthrough() so unknown extra fields do not fail validation.
// ---------------------------------------------------------------------------
export const TourTranslationSchema = z.object({
  title: z.string().catch(''),
  shortTitle: z.string().catch('').optional(),
  description: z.string().catch(''),
  cancellationPolicies: z.array(z.string()).catch([]),
  highlights: z.array(z.string()).catch([]),
  inclusions: z.array(z.string()).catch([]),
  exclusions: z.array(z.string()).catch([]),
  cardExcerpt: z.string().catch('').optional(),
  whatToBring: z.string().catch('').optional(),
  pickupDescription: z.string().catch('').optional(),
  cancellationPolicy: z.string().catch('').optional(),
  meetingPointInstructions: z.string().catch('').optional(),
  safetyGuidelines: z.array(z.string()).catch([]).optional(),
  seoTitle: z.string().catch('').optional(),
  seoDescription: z.string().catch('').optional(),
}).passthrough();

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

// ---------------------------------------------------------------------------
// Tour Addon Schema
// Matches TourAddon in src/types/tourBuilder.ts and tourEditor.ts
// ---------------------------------------------------------------------------
export const TourAddonSchema = z.object({
  id: z.string().default(() => generateUUID()),
  price: z.number().nonnegative(),
  priceType: z.enum(['per_person', 'flat']).default('per_person'),
  enabled: z.boolean().default(true),
  labels: z.record(z.string(), z.string()).catch({}),
  descriptions: z.record(z.string(), z.string()).catch({}),
}).passthrough();

export type TourAddon = z.infer<typeof TourAddonSchema>;

export function safeParseTourAddons(value: unknown): TourAddon[] {
  if (!value || !Array.isArray(value)) return [];
  const parsed = z.array(TourAddonSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

// ---------------------------------------------------------------------------
// Route Point Schema
// ---------------------------------------------------------------------------
export const RoutePointSchema = z.object({
  id: z.string().default(() => generateUUID()),
  name: z.string().catch(''),
  description: z.string().catch('').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  durationMinutes: z.number().nonnegative().optional(),
  order: z.number().int().nonnegative(),
}).passthrough();

export type RoutePoint = z.infer<typeof RoutePointSchema>;

export function safeParseRoutePoints(value: unknown): RoutePoint[] {
  if (!value || !Array.isArray(value)) return [];
  const parsed = z.array(RoutePointSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

// ---------------------------------------------------------------------------
// Booking Question Schema
// ---------------------------------------------------------------------------
export const BookingQuestionSchema = z.object({
  id: z.string().default(() => generateUUID()),
  question: z.string().min(1),
  type: z.enum(['text', 'select', 'checkbox']).default('text'),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
}).passthrough();

export type BookingQuestion = z.infer<typeof BookingQuestionSchema>;

export function safeParseBookingQuestions(value: unknown): BookingQuestion[] {
  if (!value || !Array.isArray(value)) return [];
  const parsed = z.array(BookingQuestionSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

// ---------------------------------------------------------------------------
// Meeting Point Schema
// ---------------------------------------------------------------------------
export const MeetingPointSchema = z.object({
  name: z.string().catch(''),
  address: z.string().catch('').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  instructions: z.string().catch('').optional(),
  googleMapsUrl: z.string().optional(),
}).passthrough();

export type MeetingPoint = z.infer<typeof MeetingPointSchema>;

// ---------------------------------------------------------------------------
// Pickup Option Schema
// ---------------------------------------------------------------------------
export const PickupOptionSchema = z.object({
  id: z.string().default(() => generateUUID()),
  type: z.enum(['HOTEL', 'AIRPORT', 'PORT', 'CUSTOM', 'NONE']).default('HOTEL'),
  label: z.string().catch(''),
  description: z.string().catch('').optional(),
  additionalFee: z.number().nonnegative().optional(),
  enabled: z.boolean().default(true),
}).passthrough();

export type PickupOption = z.infer<typeof PickupOptionSchema>;

export function safeParsePickupOptions(value: unknown): PickupOption[] {
  if (!value || !Array.isArray(value)) return [];
  const parsed = z.array(PickupOptionSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}
