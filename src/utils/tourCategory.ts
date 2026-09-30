/**
 * Canonical category taxonomy shared by the public catalog, the homepage
 * catalog, and the admin tour editor. `Tour.category` in the database is a
 * free-form string, so every read path normalizes it through here.
 */

/** Maps a public filter value (uppercase) → the DB category values it covers. */
const CATEGORY_FILTER_MAP: Record<string, string[]> = {
  SNORKELING:    ['snorkeling', 'sea', 'Sea'],
  DIVING:        ['diving',     'sea', 'Sea'],
  BOAT_TRIP:     ['boat_trip',  'sea', 'Sea'],
  ADVENTURE:     ['adventure',  'sea', 'Sea'],
  CITY:          ['city',       'sea', 'Sea'],
  SAFARI:        ['safari',           'Safari'],
  DESERT:        ['desert',    'safari', 'Safari'],
  CULTURAL:      ['cultural', 'Cultural', 'Historical'],
  SPA:           ['spa', 'Spa & Wellness', 'wellness'],
  ENTERTAINMENT: ['entertainment', 'Entertainment'],
};

/**
 * Coarse "Sea" alias used by the homepage hero and the homepage catalog tabs.
 * Matches every water-based category so the coarse tab never falls through to
 * an unfiltered result set.
 */
CATEGORY_FILTER_MAP.SEA = [
  'sea', 'Sea', 'snorkeling', 'diving', 'boat_trip', 'adventure', 'city',
];

export const TOUR_CATEGORY_FILTERS = CATEGORY_FILTER_MAP;
/**
 * Resolves a `?type=` / `?category=` value into the DB categories it covers.
 * Returns undefined for unknown values so callers can skip the clause rather
 * than silently returning the unfiltered catalog.
 */
export function resolveCategoryFilter(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  return CATEGORY_FILTER_MAP[raw.trim().toUpperCase()];
}

/**
 * Maps a coarse homepage tab (Sea / Safari / Cultural / Spa / Entertainment)
 * onto the canonical filter keys it should query with.
 */
export const COARSE_CATEGORY_FILTERS: Record<string, string> = {
  Sea: 'SEA',
  Safari: 'SAFARI',
  Cultural: 'CULTURAL',
  Spa: 'SPA',
  Entertainment: 'ENTERTAINMENT',
};

const SAFARI_VALUES = new Set(['safari', 'desert', 'quad', 'bedouin', 'camel']);
const CULTURAL_VALUES = new Set(['cultural', 'histor', 'heritage', 'city tour', 'temple']);
const SPA_VALUES = new Set(['spa', 'wellness', 'massage', 'hammam']);
const ENTERTAINMENT_VALUES = new Set(['entertainment', 'dolphin', 'show', 'theater', 'theatre']);

/** Coarse grouping used for card gradients, icons and the homepage tabs. */
export type TourCategoryGroup = 'Sea' | 'Safari' | 'Cultural' | 'Spa' | 'Entertainment';

export function normalizeCategory(cat: string | null | undefined): TourCategoryGroup {
  const lower = (cat || '').trim().toLowerCase();
  if (!lower) return 'Sea';
  if (SAFARI_VALUES.has(lower) || lower.includes('safari') || lower.includes('desert') || lower.includes('adventure')) return 'Safari';
  if (CULTURAL_VALUES.has(lower) || lower.includes('cultural') || lower.includes('histor')) return 'Cultural';
  if (SPA_VALUES.has(lower) || lower.includes('spa') || lower.includes('wellness')) return 'Spa';
  if (ENTERTAINMENT_VALUES.has(lower) || lower.includes('entertainment') || lower.includes('dolphin')) return 'Entertainment';
  return 'Sea';
}

/** True when the raw DB category belongs to the given coarse group. */
export function categoryMatchesGroup(cat: string | null | undefined, group: string): boolean {
  return normalizeCategory(cat) === group;
}
