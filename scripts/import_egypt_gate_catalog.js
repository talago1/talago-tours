/*
 * Imports the authorized Egypt Gate public catalogue into Talago.
 *
 * Default mode is a dry run. Pass --apply to write. New items are DRAFT;
 * exact slug/title matches update in place and retain their current status.
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const API = 'https://www.egyptgate.net/api/v1';
const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 16;
const offsetArg = process.argv.find((arg) => arg.startsWith('--offset='));
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const OFFSET = Math.max(0, Number(offsetArg?.split('=')[1]) || 0);
const LIMIT = Math.max(0, Number(limitArg?.split('=')[1]) || 0);
const prisma = new PrismaClient();

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalized(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseDuration(value) {
  const match = cleanText(value).match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  return match ? Math.max(1, Math.ceil(Number(match[1]))) : 4;
}

function categoryFrom(sourceCategories = []) {
  const source = sourceCategories.join(' ').toLowerCase();
  if (source.includes('boat') || source.includes('diving') || source.includes('water')) return 'sea';
  if (source.includes('historical') || source.includes('museum')) return 'cultural';
  if (source.includes('spa') || source.includes('massage')) return 'spa';
  if (source.includes('nightlife') || source.includes('party')) return 'entertainment';
  if (source.includes('transfer')) return 'transfer';
  if (source.includes('rental')) return 'rental';
  return 'adventure';
}

function makeSourceNote(tour) {
  return `[Authorized catalogue import] sourceId=${tour.id}; syncedAt=${new Date().toISOString()}`;
}

function sourceItinerary(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => ({
    id: `egypt-gate-${index + 1}`,
    timeTag: cleanText(item.time || item.timeTag),
    iconToken: 'location',
    pointType: 'ACTIVITY',
    title: { en: cleanText(item.title || item.name || item.label || String(item)) },
    description: { en: cleanText(item.description || item.details) },
    location: cleanText(item.location),
    included: true,
    _v: 2,
  }));
}

function localizedContent(tour) {
  const withoutSourceLinks = (value) => cleanText(value).replace(/https?:\/\/[^\s]+/gi, '').trim();
  const description = withoutSourceLinks(tour.description || tour.summary);
  const highlights = Array.isArray(tour.highlights) ? tour.highlights.filter(Boolean) : [];
  const inclusions = Array.isArray(tour.included) ? tour.included.filter(Boolean) : [];
  const exclusions = Array.isArray(tour.excluded) ? tour.excluded.filter(Boolean) : [];
  const before = Array.isArray(tour.knowBeforeYouGo) ? tour.knowBeforeYouGo.filter(Boolean) : [];
  const cancellation = cleanText(tour.cancellation?.policy);
  const base = {
    title: cleanText(tour.name), description, cardExcerpt: withoutSourceLinks(tour.summary),
    highlights, inclusions, exclusions, whatToBring: before.join('\n'),
    importantInfo: before.join('\n'), pickupDescription: '', cancellationPolicy: cancellation,
    cancellationPolicies: cancellation ? [cancellation] : [], meetingPointInstructions: '',
    meetingPointLandmark: '', safetyGuidelines: before, seoTitle: cleanText(tour.name),
    seoDescription: cleanText(tour.summary), requirements: '', accessibilityNotes: '',
    mobilityNotes: '', faqItems: [], internalNotes: makeSourceNote(tour),
  };
  return { en: base, de: { ...base, title: '', description: '' }, ru: { ...base, title: '', description: '' }, fr: { ...base, title: '', description: '' }, it: { ...base, title: '', description: '' }, pl: { ...base, title: '', description: '' }, es: { ...base, title: '', description: '' }, uk: { ...base, title: '', description: '' } };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function allSummaries() {
  const first = await fetchJson(`${API}/tours?limit=100&offset=0`);
  const pages = [first.results || []];
  for (let offset = first.results.length; offset < first.total; offset += 100) {
    const page = await fetchJson(`${API}/tours?limit=100&offset=${offset}`);
    pages.push(page.results || []);
  }
  return pages.flat();
}

async function mapConcurrent(items, callback) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await callback(items[index]);
    }
  }));
  return results;
}

async function ensureDestinationAndZone(source) {
  const slug = source.slug;
  let destination = await prisma.destination.findUnique({ where: { slug } });
  if (!destination) {
    if (!APPLY) {
      return {
        destination: { id: `dry-run-destination-${slug}` },
        zone: { id: `dry-run-zone-${slug}` },
      };
    }
    destination = await prisma.destination.create({
      data: { name: source.name, slug, city: source.name, countryCode: 'EG', timezone: 'Africa/Cairo', isVisible: true, translations: { en: { name: source.name } } },
    });
  }
  let zone = await prisma.zone.findFirst({ where: { destinationId: destination.id, isActive: true }, orderBy: { name: 'asc' } });
  if (!zone) {
    if (!APPLY) return { destination, zone: { id: `dry-run-zone-${slug}` } };
    zone = await prisma.zone.create({ data: { name: `${source.name} - General Pickup`, destinationId: destination.id, transferFee: 0, isActive: true } });
  }
  return { destination, zone };
}

async function importTour(tour, destinations, existingTours) {
  const sourceDestination = destinations.get(tour.destination.slug);
  if (!sourceDestination) throw new Error(`Missing destination mapping for ${tour.destination.slug}`);
  const { destination, zone } = await ensureDestinationAndZone(sourceDestination);
  const titleKey = normalized(tour.name);
  const exact = existingTours.find((item) => item.slug === tour.slug || (item.destinationId === destination.id && normalized(item.title) === titleKey));
  const price = Number(tour.price?.adult ?? tour.price?.from ?? 0);
  const galleries = Array.from(new Set((Array.isArray(tour.images) ? tour.images : [tour.image]).filter(Boolean)));
  const content = localizedContent(tour);
  const sourceText = [tour.description, tour.summary, ...(tour.included || [])].join(' ').toLowerCase();
  const sourceNote = makeSourceNote(tour);
  const mediaPayload = exact?.galleryImages?.length
    ? {}
    : { coverImage: tour.image || galleries[0] || null, thumbnailUrl: tour.image || galleries[0] || null, galleryImages: galleries };
  const payload = {
    type: tour.price?.unit === 'per_item' ? 'PRIVATE' : 'SHARED',
    basePriceUSD: price, basePrice: price, adultPrice: price, priceAdult: price,
    durationHours: parseDuration(tour.duration), duration: cleanText(tour.duration), maxCapacity: 30,
    zoneId: zone.id, destinationId: destination.id, countryCode: 'EG', city: sourceDestination.name, timezone: 'Africa/Cairo',
    ...mediaPayload,
    highlights: content.en.highlights, inclusions: content.en.inclusions, exclusions: content.en.exclusions,
    category: categoryFrom(tour.categories), secondaryCategories: Array.isArray(tour.categories) ? tour.categories : [],
    tags: Array.isArray(tour.categories) ? tour.categories : [], activityTypes: Array.isArray(tour.categories) ? tour.categories : [], ratingAverage: Number(tour.rating || 0), ratingCount: Number(tour.reviewCount || 0),
    allowPayAtLocation: true, showExcerptOnCard: true, displayExcerpt: true, cardExcerpt: cleanText(tour.summary),
    whatToBring: content.en.whatToBring || null, pickupDescription: sourceText.includes('pickup') || sourceText.includes('transfer') ? 'Pickup details are confirmed after booking.' : null,
    hotelPickupIncluded: sourceText.includes('hotel pickup') || sourceText.includes('hotel transfer'), pickupTimes: [], pickupType: 'hotel',
    itinerary: sourceItinerary(tour.itinerary), cancellationPolicy: cleanText(tour.cancellation?.policy) || null,
    freeCancellationHours: 24, instantConfirmation: Boolean(tour.bookable), cutoffHours: 12,
    safetyGuidelines: content.en.safetyGuidelines, insuranceIncluded: false,
    metaTitle: cleanText(tour.name), metaDescription: cleanText(tour.summary), keywords: Array.isArray(tour.categories) ? tour.categories : [],
  };

  if (exact) {
    const prior = exact.translations && typeof exact.translations === 'object' ? exact.translations : {};
    const translations = { ...prior, en: { ...(prior.en || {}), ...content.en, internalNotes: [prior.en?.internalNotes, sourceNote].filter(Boolean).join('\n') } };
    if (APPLY) await prisma.tour.update({ where: { id: exact.id }, data: { ...payload, translations, internalNotes: [exact.internalNotes, sourceNote].filter(Boolean).join('\n') } });
    return { action: 'updated', sourceSlug: tour.slug, talagoSlug: exact.slug };
  }

  const safeSlug = `egypt-gate-${tour.destination.slug}-${normalized(tour.slug || tour.name)}`.slice(0, 190);
  if (APPLY) await prisma.tour.upsert({ where: { slug: safeSlug }, update: { ...payload, translations: content, internalNotes: sourceNote }, create: { slug: safeSlug, status: 'DRAFT', ...payload, translations: content, internalNotes: sourceNote } });
  return { action: 'created-draft', sourceSlug: tour.slug, talagoSlug: safeSlug };
}

async function main() {
  loadDotEnv();
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required in .env');
  const catalogue = await allSummaries();
  const summaries = LIMIT ? catalogue.slice(OFFSET, OFFSET + LIMIT) : catalogue.slice(OFFSET);
  if (!summaries.length) throw new Error(`No tours selected at offset ${OFFSET}.`);
  console.log(`Selected ${summaries.length} of ${catalogue.length} catalogue records from Egypt Gate.`);
  const details = await mapConcurrent(summaries, async (summary) => {
    const response = await fetchJson(`${API}/tours/${encodeURIComponent(summary.slug)}?destination=${encodeURIComponent(summary.destination.slug)}`);
    return response.tour;
  });
  const destinations = new Map((await fetchJson(`${API}/destinations`)).destinations.map((item) => [item.slug, item]));
  const existing = await prisma.tour.findMany({ select: { id: true, slug: true, destinationId: true, translations: true, internalNotes: true, status: true, coverImage: true, thumbnailUrl: true, galleryImages: true } });
  const existingTours = existing.map((item) => ({ ...item, title: cleanText(item.translations?.en?.title) }));
  const report = [];
  for (const detail of details) report.push(await importTour(detail, destinations, existingTours));
  const counts = report.reduce((result, item) => ({ ...result, [item.action]: (result[item.action] || 0) + 1 }), {});
  console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', sourceTours: details.length, ...counts }, null, 2));
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'data', 'egypt-gate-import-report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), mode: APPLY ? 'apply' : 'dry-run', offset: OFFSET, limit: LIMIT || null, counts, report }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
