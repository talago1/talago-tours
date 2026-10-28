import type {
  TourEditorData,
  LocalizedTourContent,
  ItineraryMilestone,
  RoutePoint,
  TourAddon,
  BookingQuestion,
  LanguageCode,
} from '@/types/tourEditor';
import {
  createDefaultTourEditorData,
  createDefaultLocalizedContent,
  calculateTourCompleteness,
} from '@/types/tourEditor';
import { createEmptyMilestone } from '@/types/itinerary';

export interface ParseValidationError {
  section: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TourTextParseResult {
  data: TourEditorData;
  errors: ParseValidationError[];
  warnings: ParseValidationError[];
  completeness: number;
  parsedSectionsCount: number;
}

function parseBoolean(val: string | undefined, fallback: boolean = false): boolean {
  if (!val) return fallback;
  const s = val.trim().toLowerCase();
  if (['true', 'yes', '1', 'y', 'enabled', 'on'].includes(s)) return true;
  if (['false', 'no', '0', 'n', 'disabled', 'off'].includes(s)) return false;
  return fallback;
}

function parseNumber(val: string | undefined, fallback: number = 0): number {
  if (!val) return fallback;
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? fallback : n;
}

function parseList(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.)\]]\s*/, '').trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

function parseCommaList(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extracts a key-value or block content under section headings
 */
class SectionExtractor {
  private content: string;

  constructor(raw: string) {
    this.content = raw;
  }

  /**
   * Find value for a specific field line e.g. "ADULT_PRICE: 45" or "PRICE: $45"
   */
  getField(keyPattern: string): string {
    const regex = new RegExp(`^(?:[#*\\s-]*)${keyPattern}\\s*:\\s*(.+)$`, 'im');
    const match = this.content.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Extracts a multiline block starting with a key until next UPPERCASE_KEY: or markdown # section
   */
  getBlock(keyPattern: string): string {
    const regex = new RegExp(
      `^(?:[#*\\s-]*)${keyPattern}\\s*:\\s*\\n([\\s\\S]*?)(?=(?:\\n\\s*#{1,4}\\s|\\n\\s*[A-Z0-9_]{3,30}\\s*:|\\Z))`,
      'im'
    );
    const match = this.content.match(regex);
    if (match) return match[1].trim();

    // Fallback: single line field
    return this.getField(keyPattern);
  }

  /**
   * Extracts content of a markdown section e.g. "### 14. ITINERARY" until the next heading of same or higher level
   */
  getSectionBlock(sectionNameOrNumber: string): string {
    const escaped = sectionNameOrNumber.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(
      `^(?:#{1,4}\\s*(?:SECTION\\s*)?(?:${escaped})[^\\n]*)\\n([\\s\\S]*?)(?=(?:\\n\\s*#{1,4}\\s|\\Z))`,
      'im'
    );
    const match = this.content.match(regex);
    return match ? match[1].trim() : '';
  }
}

/**
 * Authoritative 28-Section Tour Text Parser
 */
export function parseTourText(rawText: string): TourTextParseResult {
  const resultData = createDefaultTourEditorData();
  const errors: ParseValidationError[] = [];
  const warnings: ParseValidationError[] = [];
  let parsedSectionsCount = 0;

  const trimmed = rawText.trim();
  if (!trimmed) {
    errors.push({ section: 'Input', field: 'content', message: 'Input text is empty.', severity: 'error' });
    return { data: resultData, errors, warnings, completeness: 0, parsedSectionsCount: 0 };
  }

  // Support JSON full objects if pasted
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(trimmed);
      if (typeof parsedJson === 'object' && parsedJson !== null) {
        Object.assign(resultData, parsedJson);
        const completeness = calculateTourCompleteness(resultData).score;
        return {
          data: resultData,
          errors: [],
          warnings: [],
          completeness,
          parsedSectionsCount: 28,
        };
      }
    } catch {
      // Fall through to plain text parsing
    }
  }

  const ex = new SectionExtractor(trimmed);

  // ─── 1. BASIC INFORMATION ──────────────────────────────────────────────────
  const sec1 = ex.getSectionBlock('1') || ex.getSectionBlock('BASIC INFORMATION');
  const ex1 = new SectionExtractor(sec1 || trimmed);

  const title = ex1.getField('(?:TITLE|TOUR_TITLE|EXPERIENCE_TITLE)') || ex.getField('(?:TITLE|TOUR_TITLE)');
  const slug = ex1.getField('SLUG') || ex.getField('SLUG');
  const categoryRaw = ex1.getField('CATEGORY') || ex.getField('CATEGORY');
  const typeRaw = ex1.getField('(?:TYPE|TOUR_TYPE)') || ex.getField('TYPE');
  const badgesRaw = ex1.getField('BADGES') || ex.getField('BADGES');
  const customBadge = ex1.getField('CUSTOM_BADGE');
  const tagsRaw = ex1.getField('TAGS');
  const description = ex1.getBlock('(?:DESCRIPTION|OVERVIEW|SUMMARY)') || ex.getBlock('(?:DESCRIPTION|OVERVIEW)');
  const cardExcerpt = ex1.getField('(?:CARD_EXCERPT|SHORT_EXCERPT|EXCERPT)');

  if (title) {
    resultData.translations.en.title = title;
    resultData.slug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    parsedSectionsCount++;
  } else {
    errors.push({ section: '1. Basic Information', field: 'title', message: 'Title is required.', severity: 'error' });
  }

  if (description) {
    resultData.translations.en.description = description;
  } else {
    warnings.push({ section: '1. Basic Information', field: 'description', message: 'Description is recommended.', severity: 'warning' });
  }

  if (categoryRaw) {
    resultData.category = categoryRaw.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'sea';
  }
  if (typeRaw) {
    const t = typeRaw.toUpperCase();
    resultData.type = t === 'PRIVATE' ? 'PRIVATE' : 'SHARED';
  }
  if (cardExcerpt) {
    resultData.cardExcerpt = cardExcerpt;
    resultData.translations.en.cardExcerpt = cardExcerpt;
    resultData.showExcerptOnCard = true;
  }
  if (customBadge) resultData.customBadge = customBadge;
  if (tagsRaw) resultData.tags = parseCommaList(tagsRaw);

  const badges = badgesRaw.toLowerCase();
  if (badges.includes('featured')) resultData.isFeatured = true;
  if (badges.includes('best') || badges.includes('bestseller')) resultData.isBestSeller = true;
  if (badges.includes('recommend')) resultData.isRecommended = true;
  if (badges.includes('vip')) resultData.isVip = true;
  if (badges.includes('family')) resultData.isFamilyFriendly = true;
  if (badges.includes('new')) resultData.isNew = true;

  // ─── 2. DESTINATION & LOCATION ─────────────────────────────────────────────
  const sec2 = ex.getSectionBlock('2') || ex.getSectionBlock('DESTINATION');
  const ex2 = new SectionExtractor(sec2 || trimmed);

  const destCountry = ex2.getField('(?:COUNTRY_CODE|COUNTRY)') || 'EG';
  const destCity = ex2.getField('CITY') || 'Hurghada';
  const destRegion = ex2.getField('REGION');
  const destAddress = ex2.getField('ADDRESS');
  const destLat = parseNumber(ex2.getField('(?:LATITUDE|LAT)'), 0);
  const destLng = parseNumber(ex2.getField('(?:LONGITUDE|LNG)'), 0);
  const destId = ex2.getField('(?:DESTINATION_ID|DESTINATION)');
  const zoneId = ex2.getField('(?:ZONE_ID|ZONE)');

  resultData.countryCode = destCountry;
  resultData.city = destCity;
  if (destRegion) resultData.region = destRegion;
  if (destAddress) resultData.address = destAddress;
  if (destLat) resultData.latitude = destLat;
  if (destLng) resultData.longitude = destLng;
  if (destId) resultData.destinationId = destId;
  if (zoneId) resultData.zoneId = zoneId;
  if (destCity || destId) parsedSectionsCount++;

  // ─── 3. IMAGES & MEDIA ─────────────────────────────────────────────────────
  const sec3 = ex.getSectionBlock('3') || ex.getSectionBlock('IMAGES');
  const ex3 = new SectionExtractor(sec3 || trimmed);

  const coverImage = ex3.getField('(?:COVER_IMAGE|HERO_IMAGE|MAIN_IMAGE)') || ex.getField('COVER_IMAGE');
  const galleryBlock = ex3.getBlock('(?:GALLERY_IMAGES|GALLERY|PHOTOS)') || ex.getBlock('GALLERY_IMAGES');
  const videoUrl = ex3.getField('(?:VIDEO_URL|VIDEO)');

  if (coverImage) {
    resultData.coverImage = coverImage;
    parsedSectionsCount++;
  }
  if (galleryBlock) {
    const gallery = parseList(galleryBlock);
    if (gallery.length > 0) resultData.galleryImages = gallery;
  }
  if (videoUrl) resultData.videoUrl = videoUrl;

  // ─── 4. OPERATOR & OPERATIONS ──────────────────────────────────────────────
  const sec4 = ex.getSectionBlock('4') || ex.getSectionBlock('OPERATOR');
  const ex4 = new SectionExtractor(sec4 || trimmed);

  const opName = ex4.getField('OPERATOR_NAME');
  const opPhone = ex4.getField('OPERATOR_PHONE');
  const opEmail = ex4.getField('OPERATOR_EMAIL');
  const opNotes = ex4.getBlock('(?:DISPATCH_NOTES|OPERATOR_NOTES)');

  if (opName) {
    resultData.operatorName = opName;
    parsedSectionsCount++;
  }
  if (opPhone) resultData.operatorPhone = opPhone;
  if (opEmail) resultData.operatorEmail = opEmail;
  if (opNotes) resultData.internalNotes = opNotes;

  // ─── 5. PRICING ENGINE ─────────────────────────────────────────────────────
  const sec5 = ex.getSectionBlock('5') || ex.getSectionBlock('PRICING');
  const ex5 = new SectionExtractor(sec5 || trimmed);

  const adultPrice = parseNumber(ex5.getField('(?:ADULT_PRICE|PRICE|BASE_PRICE_USD|BASE_PRICE)'));
  const originalPrice = parseNumber(ex5.getField('(?:ORIGINAL_PRICE|STRIKE_PRICE)'));
  const privatePrice = parseNumber(ex5.getField('PRIVATE_PRICE'));
  const allowDeposit = parseBoolean(ex5.getField('ALLOW_DEPOSIT'), false);
  const depositPct = parseNumber(ex5.getField('DEPOSIT_PERCENTAGE'), 100);
  const allowPayLocation = parseBoolean(ex5.getField('ALLOW_PAY_AT_LOCATION'), true);

  if (adultPrice > 0) {
    resultData.adultPrice = adultPrice;
    resultData.basePriceUSD = adultPrice;
    parsedSectionsCount++;
  } else {
    errors.push({ section: '5. Pricing Engine', field: 'adultPrice', message: 'Valid Adult Price > 0 is required.', severity: 'error' });
  }

  if (originalPrice > 0) resultData.originalPrice = originalPrice;
  if (privatePrice > 0) resultData.privatePrice = privatePrice;
  resultData.allowDeposit = allowDeposit;
  resultData.depositPercentage = depositPct;
  resultData.allowPayAtLocation = allowPayLocation;

  // ─── 6. GUEST TYPES & AGE RULES ────────────────────────────────────────────
  const sec6 = ex.getSectionBlock('6') || ex.getSectionBlock('GUEST TYPES');
  const ex6 = new SectionExtractor(sec6 || trimmed);

  const childPrice = parseNumber(ex6.getField('CHILD_PRICE'), 0);
  const childMinAge = parseNumber(ex6.getField('CHILD_MIN_AGE'), 3);
  const childMaxAge = parseNumber(ex6.getField('CHILD_MAX_AGE'), 11);
  const childEnabled = parseBoolean(ex6.getField('CHILD_ENABLED'), childPrice > 0);

  const infantPrice = parseNumber(ex6.getField('INFANT_PRICE'), 0);
  const infantMinAge = parseNumber(ex6.getField('INFANT_MIN_AGE'), 0);
  const infantMaxAge = parseNumber(ex6.getField('INFANT_MAX_AGE'), 2);
  const infantEnabled = parseBoolean(ex6.getField('INFANT_ENABLED'), false);

  resultData.childEnabled = childEnabled;
  resultData.childPrice = childPrice;
  resultData.childMinAge = childMinAge;
  resultData.childMaxAge = childMaxAge;
  resultData.infantEnabled = infantEnabled;
  resultData.infantPrice = infantPrice;
  resultData.infantMinAge = infantMinAge;
  resultData.infantMaxAge = infantMaxAge;
  if (childEnabled || infantEnabled) parsedSectionsCount++;

  // ─── 7. ADD-ONS & UPGRADES ─────────────────────────────────────────────────
  const sec7 = ex.getSectionBlock('7') || ex.getSectionBlock('ADD-ONS');
  if (sec7) {
    const lines = parseList(sec7);
    const addons: TourAddon[] = [];
    lines.forEach((line, idx) => {
      // Format: Name | Price: 15 | Type: per_person | Description
      const parts = line.split('|').map((s) => s.trim());
      if (parts[0]) {
        const name = parts[0];
        let price = 0;
        let priceType: 'flat' | 'per_person' = 'per_person';
        let desc = '';

        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (/price/i.test(p)) {
            price = parseNumber(p);
          } else if (/booking|flat/i.test(p)) {
            priceType = 'flat';
          } else if (/person/i.test(p)) {
            priceType = 'per_person';
          } else {
            desc = p;
          }
        }
        const emptyLabels: Record<LanguageCode, string> = {
          en: '',
          de: '',
          ru: '',
          fr: '',
          it: '',
          pl: '',
          es: '',
          uk: '',
        };
        addons.push({
          id: `addon-${idx}-${Date.now()}`,
          price,
          priceType,
          enabled: true,
          labels: { ...emptyLabels, en: name },
          descriptions: { ...emptyLabels, en: desc },
        });
      }
    });
    if (addons.length > 0) {
      resultData.addons = addons;
      parsedSectionsCount++;
    }
  }

  // ─── 8. AVAILABILITY & CAPACITY ────────────────────────────────────────────
  const sec8 = ex.getSectionBlock('8') || ex.getSectionBlock('CAPACITY');
  const ex8 = new SectionExtractor(sec8 || trimmed);

  const maxCapacity = parseNumber(ex8.getField('(?:MAX_CAPACITY|CAPACITY)'), 20);
  const cutoffHours = parseNumber(ex8.getField('(?:CUTOFF_HOURS|CUT_OFF)'), 12);
  const instantConf = parseBoolean(ex8.getField('(?:INSTANT_CONFIRMATION|INSTANT)'), true);

  resultData.maxCapacity = maxCapacity > 0 ? maxCapacity : 20;
  resultData.cutoffHours = cutoffHours;
  resultData.instantConfirmation = instantConf;
  parsedSectionsCount++;

  // ─── 9. SCHEDULE & PICKUP TIMES ────────────────────────────────────────────
  const sec9 = ex.getSectionBlock('9') || ex.getSectionBlock('SCHEDULE');
  const ex9 = new SectionExtractor(sec9 || trimmed);

  const durationHours = parseNumber(ex9.getField('(?:DURATION_HOURS|DURATION)'), 4);
  const durationDisplay = ex9.getField('DURATION_DISPLAY') || `${durationHours} hours`;
  const pickupTimesRaw = ex9.getField('(?:PICKUP_TIMES|DEPARTURE_TIMES)');

  if (durationHours > 0) {
    resultData.durationHours = durationHours;
    resultData.durationDisplay = durationDisplay;
    parsedSectionsCount++;
  } else {
    errors.push({ section: '9. Schedule', field: 'durationHours', message: 'Duration in hours is required.', severity: 'error' });
  }
  if (pickupTimesRaw) {
    resultData.pickupTimes = parseCommaList(pickupTimesRaw);
  }

  // ─── 10. HOTEL PICKUP & TRANSFERS ──────────────────────────────────────────
  const sec10 = ex.getSectionBlock('10') || ex.getSectionBlock('PICKUP');
  const ex10 = new SectionExtractor(sec10 || trimmed);

  const pickupTypeRaw = ex10.getField('(?:PICKUP_TYPE|TRANSFER_TYPE)');
  const pickupInc = parseBoolean(ex10.getField('HOTEL_PICKUP_INCLUDED'), true);
  const pickupDesc = ex10.getBlock('(?:PICKUP_DESCRIPTION|PICKUP_INSTRUCTIONS)');

  resultData.hotelPickupIncluded = pickupInc;
  if (pickupDesc) {
    resultData.pickupDescription = pickupDesc;
    resultData.translations.en.pickupDescription = pickupDesc;
  }
  if (pickupTypeRaw) {
    const pt = pickupTypeRaw.toLowerCase();
    if (['hotel', 'meeting_point', 'airport', 'port', 'station', 'private_address', 'both', 'none'].includes(pt)) {
      resultData.pickupType = pt as any;
    }
    parsedSectionsCount++;
  }
  const pickupAreasBlock = ex10.getBlock('(?:PICKUP_AREAS|TRANSFER_AREAS)');
  const pickupAreasRaw = pickupAreasBlock ? parseList(pickupAreasBlock) : [];
  if (pickupAreasRaw && pickupAreasRaw.length > 0) {
    const areas: Array<{ id: string; name: string; price: number; notes?: string; isFree?: boolean }> = [];
    pickupAreasRaw.forEach((line: string, idx: number) => {
      const parts = line.split('|').map((s: string) => s.trim());
      const name = parts[0] || `Area ${idx + 1}`;
      let price = 0;
      let isFree = false;
      let notes = '';

      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        const priceMatch = p.match(/(?:price|fee|cost)\s*:\s*(\d+(?:\.\d+)?)/i);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
        if (/free|included/i.test(p)) {
          isFree = true;
          price = 0;
        }
        const notesMatch = p.match(/(?:notes?|info)\s*:\s*(.+)/i);
        if (notesMatch) {
          notes = notesMatch[1].trim();
        }
      }

      if (price === 0 && !isFree) {
        const inlineMatch = name.match(/:\s*(\d+(?:\.\d+)?)/);
        if (inlineMatch) price = parseFloat(inlineMatch[1]);
      }

      areas.push({
        id: `area-${idx + 1}-${Date.now()}`,
        name: name.replace(/:\s*\d+(?:\.\d+)?/, '').trim(),
        price,
        isFree: isFree || price === 0,
        notes: notes || undefined,
      });
    });

    if (areas.length > 0) {
      resultData.pickupAreas = areas;
    }
  }

  // ─── 11. MEETING POINT ─────────────────────────────────────────────────────
  const sec11 = ex.getSectionBlock('11') || ex.getSectionBlock('MEETING POINT');
  const ex11 = new SectionExtractor(sec11 || trimmed);

  const mpName = ex11.getField('(?:MEETING_POINT_NAME|MEETING_POINT)');
  const mpAddress = ex11.getField('MEETING_POINT_ADDRESS');
  const mpLandmark = ex11.getField('MEETING_POINT_LANDMARK');
  const mpInstructions = ex11.getBlock('MEETING_POINT_INSTRUCTIONS');
  const mpMapUrl = ex11.getField('(?:MEETING_POINT_MAP_URL|MAP_URL)');
  const mpLat = parseNumber(ex11.getField('MEETING_POINT_LAT'));
  const mpLng = parseNumber(ex11.getField('MEETING_POINT_LNG'));

  if (mpName) {
    resultData.meetingPointName = mpName;
    parsedSectionsCount++;
  }
  if (mpAddress) resultData.meetingPointAddress = mpAddress;
  if (mpLandmark) {
    resultData.meetingPointLandmark = mpLandmark;
    resultData.translations.en.meetingPointLandmark = mpLandmark;
  }
  if (mpInstructions) {
    resultData.meetingPointInstructions = mpInstructions;
    resultData.translations.en.meetingPointInstructions = mpInstructions;
  }
  if (mpMapUrl) resultData.meetingPointMapUrl = mpMapUrl;
  if (mpLat) resultData.meetingPointLat = mpLat;
  if (mpLng) resultData.meetingPointLng = mpLng;

  // ─── 12. TRANSPORTATION DETAILS ────────────────────────────────────────────
  const sec12 = ex.getSectionBlock('12') || ex.getSectionBlock('TRANSPORT');
  const ex12 = new SectionExtractor(sec12 || trimmed);

  const vehicleType = ex12.getField('VEHICLE_TYPE');
  const boatType = ex12.getField('BOAT_TYPE');
  const ac = parseBoolean(ex12.getField('(?:AIR_CONDITIONED|AC)'), true);
  const transferNotes = ex12.getBlock('(?:TRANSFER_NOTES|FLEET_NOTES)');

  if (vehicleType) resultData.vehicleType = vehicleType;
  if (boatType) resultData.boatType = boatType;
  resultData.airConditioned = ac;
  if (transferNotes) resultData.transferNotes = transferNotes;
  if (vehicleType || boatType) parsedSectionsCount++;

  // ─── 13. ROUTE & WAYPOINTS ─────────────────────────────────────────────────
  const sec13 = ex.getSectionBlock('13') || ex.getSectionBlock('ROUTE');
  if (sec13) {
    const lines = parseList(sec13);
    const routeStops: RoutePoint[] = [];
    lines.forEach((line, idx) => {
      // Format: Name | Lat: 27.2 | Lng: 33.8 | Duration: 60 | Description
      const parts = line.split('|').map((s) => s.trim());
      if (parts[0]) {
        let lat: number | undefined;
        let lng: number | undefined;
        let dur: number | undefined;
        let desc = '';

        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (/lat/i.test(p)) lat = parseNumber(p);
          else if (/lng/i.test(p)) lng = parseNumber(p);
          else if (/duration|min/i.test(p)) dur = parseNumber(p);
          else desc = p;
        }

        routeStops.push({
          id: `stop-${idx}-${Date.now()}`,
          name: parts[0],
          latitude: lat,
          longitude: lng,
          durationMinutes: dur,
          description: desc,
          order: idx + 1,
        });
      }
    });
    if (routeStops.length > 0) {
      resultData.routeStops = routeStops;
      parsedSectionsCount++;
    }
  }

  // ─── 14. ITINERARY TIMELINE ────────────────────────────────────────────────
  const sec14 = ex.getSectionBlock('14') || ex.getSectionBlock('ITINERARY');
  const itBlock = sec14 || ex.getBlock('ITINERARY');
  if (itBlock) {
    const lines = parseList(itBlock);
    const milestones: ItineraryMilestone[] = [];

    lines.forEach((line, idx) => {
      // Check "09:00 - Pickup at Hotel | Short desc"
      const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(.+)/);
      const milestone = createEmptyMilestone();
      const rawTextPart = timeMatch ? timeMatch[2].trim() : line;
      const parts = rawTextPart.split('|').map((s) => s.trim());

      milestones.push({
        ...milestone,
        id: `ms-${idx}-${Date.now()}`,
        timeTag: timeMatch ? timeMatch[1] : `${idx + 1}`,
        title: {
          ...milestone.title,
          en: parts[0],
        },
        description: {
          ...milestone.description,
          en: parts[1] || '',
        },
      });
    });

    if (milestones.length > 0) {
      resultData.itinerary = milestones;
      parsedSectionsCount++;
    }
  }

  // ─── 15. ACTIVITIES & HIGHLIGHTS ───────────────────────────────────────────
  const sec15 = ex.getSectionBlock('15') || ex.getSectionBlock('ACTIVITIES');
  const hlBlock = sec15 || ex.getBlock('HIGHLIGHTS');
  if (hlBlock) {
    const highlights = parseList(hlBlock);
    if (highlights.length > 0) {
      resultData.highlights = highlights;
      resultData.translations.en.highlights = highlights;
      parsedSectionsCount++;
    }
  }

  // ─── 16. INCLUDED FEATURES ─────────────────────────────────────────────────
  const sec16 = ex.getSectionBlock('16') || ex.getSectionBlock('INCLUSIONS');
  const incBlock = sec16 || ex.getBlock('INCLUSIONS');
  if (incBlock) {
    const inclusions = parseList(incBlock);
    if (inclusions.length > 0) {
      resultData.inclusions = inclusions;
      resultData.translations.en.inclusions = inclusions;
      parsedSectionsCount++;
    }
  }

  // ─── 17. EXCLUDED ITEMS ────────────────────────────────────────────────────
  const sec17 = ex.getSectionBlock('17') || ex.getSectionBlock('EXCLUSIONS');
  const excBlock = sec17 || ex.getBlock('EXCLUSIONS');
  if (excBlock) {
    const exclusions = parseList(excBlock);
    if (exclusions.length > 0) {
      resultData.exclusions = exclusions;
      resultData.translations.en.exclusions = exclusions;
      parsedSectionsCount++;
    }
  }

  // ─── 18. WHAT TO BRING ─────────────────────────────────────────────────────
  const sec18 = ex.getSectionBlock('18') || ex.getSectionBlock('WHAT TO BRING');
  const bringBlock = sec18 || ex.getBlock('WHAT_TO_BRING');
  if (bringBlock) {
    resultData.whatToBring = bringBlock;
    resultData.translations.en.whatToBring = bringBlock;
    parsedSectionsCount++;
  }

  // ─── 18a. IMPORTANT INFORMATION ───────────────────────────────────────────
  const sec18a = ex.getSectionBlock('18a') || ex.getSectionBlock('IMPORTANT INFO');
  const infoBlock = sec18a || ex.getBlock('(?:IMPORTANT_INFO|IMPORTANT_INFORMATION)');
  if (infoBlock) {
    resultData.translations.en.importantInfo = infoBlock;
    parsedSectionsCount++;
  }

  // ─── 18b. FAQS ─────────────────────────────────────────────────────────────
  const sec18b = ex.getSectionBlock('18b') || ex.getSectionBlock('FAQS');
  const faqBlock = sec18b || ex.getBlock('FAQS');
  if (faqBlock) {
    const faqs: Array<{ question: string; answer: string }> = [];
    const lines = faqBlock.split('\n');
    let currentQ = '';
    let currentA = '';

    lines.forEach((l) => {
      const qMatch = l.match(/^(?:Q\s*:|Question\s*:)\s*(.+)$/i);
      const aMatch = l.match(/^(?:A\s*:|Answer\s*:)\s*(.+)$/i);

      if (qMatch) {
        if (currentQ && currentA) {
          faqs.push({ question: currentQ.trim(), answer: currentA.trim() });
          currentA = '';
        }
        currentQ = qMatch[1];
      } else if (aMatch) {
        currentA = aMatch[1];
      } else if (currentA) {
        currentA += ' ' + l.trim();
      }
    });

    if (currentQ && currentA) {
      faqs.push({ question: currentQ.trim(), answer: currentA.trim() });
    }

    if (faqs.length > 0) {
      resultData.faqItems = faqs;
      resultData.translations.en.faqItems = faqs;
      parsedSectionsCount++;
    }
  }

  // ─── 19. REQUIREMENTS & FITNESS ────────────────────────────────────────────
  const sec19 = ex.getSectionBlock('19') || ex.getSectionBlock('REQUIREMENTS');
  const ex19 = new SectionExtractor(sec19 || trimmed);

  const fitness = ex19.getField('FITNESS_LEVEL');
  const reqText = ex19.getBlock('REQUIREMENTS');
  if (fitness) resultData.fitnessLevel = fitness;
  if (reqText) {
    resultData.requirements = reqText;
    resultData.translations.en.requirements = reqText;
    parsedSectionsCount++;
  }

  // ─── 20. ACCESSIBILITY & SPECIAL NEEDS ─────────────────────────────────────
  const sec20 = ex.getSectionBlock('20') || ex.getSectionBlock('ACCESSIBILITY');
  const ex20 = new SectionExtractor(sec20 || trimmed);

  const wheelchair = parseBoolean(ex20.getField('WHEELCHAIR_ACCESSIBLE'), false);
  const stroller = parseBoolean(ex20.getField('STROLLER_ACCESSIBLE'), false);
  const mobility = ex20.getBlock('MOBILITY_NOTES');
  const accessNotes = ex20.getBlock('ACCESSIBILITY_NOTES');

  resultData.wheelchairAccessible = wheelchair;
  resultData.strollerAccessible = stroller;
  if (mobility) {
    resultData.mobilityNotes = mobility;
    resultData.translations.en.mobilityNotes = mobility;
  }
  if (accessNotes) {
    resultData.accessibilityNotes = accessNotes;
    resultData.translations.en.accessibilityNotes = accessNotes;
  }
  if (wheelchair || stroller || mobility || accessNotes) parsedSectionsCount++;

  // ─── 21. SAFETY & GUIDELINES ───────────────────────────────────────────────
  const sec21 = ex.getSectionBlock('21') || ex.getSectionBlock('SAFETY');
  const ex21 = new SectionExtractor(sec21 || trimmed);

  const safetyList = parseList(ex21.getBlock('SAFETY_GUIDELINES') || sec21);
  const insurance = parseBoolean(ex21.getField('INSURANCE_INCLUDED'), true);
  const emergency = ex21.getField('EMERGENCY_CONTACT');

  if (safetyList.length > 0) {
    resultData.safetyGuidelines = safetyList;
    resultData.translations.en.safetyGuidelines = safetyList;
  }
  resultData.insuranceIncluded = insurance;
  if (emergency) resultData.emergencyContact = emergency;
  if (safetyList.length > 0 || emergency) parsedSectionsCount++;

  // ─── 22. CANCELLATION POLICY ───────────────────────────────────────────────
  const sec22 = ex.getSectionBlock('22') || ex.getSectionBlock('CANCELLATION');
  const ex22 = new SectionExtractor(sec22 || trimmed);

  const cancelHours = parseNumber(ex22.getField('(?:FREE_CANCELLATION_HOURS|CANCELLATION_HOURS)'), 24);
  const cancelPolicy = ex22.getBlock('CANCELLATION_POLICY') || sec22;

  resultData.freeCancellationHours = cancelHours;
  if (cancelPolicy) {
    resultData.cancellationPolicy = cancelPolicy;
    resultData.translations.en.cancellationPolicy = cancelPolicy;
    parsedSectionsCount++;
  }

  // ─── 23. CUSTOM BOOKING QUESTIONS ──────────────────────────────────────────
  const sec23 = ex.getSectionBlock('23') || ex.getSectionBlock('QUESTIONS');
  if (sec23) {
    const lines = parseList(sec23);
    const questions: BookingQuestion[] = [];
    lines.forEach((line, idx) => {
      // Format: Hotel Name and Room | Type: text | Required: yes
      const parts = line.split('|').map((s) => s.trim());
      if (parts[0]) {
        let qType: BookingQuestion['type'] = 'text';
        let required = true;
        let options: string[] = [];

        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (/type/i.test(p)) {
            const t = p.split(':')[1]?.trim().toLowerCase();
            if (['text', 'number', 'phone', 'select', 'radio', 'checkbox', 'date'].includes(t)) {
              qType = t as BookingQuestion['type'];
            }
          } else if (/required/i.test(p)) {
            required = parseBoolean(p.split(':')[1], true);
          } else if (/options/i.test(p)) {
            options = parseCommaList(p.split(':')[1]);
          }
        }

        questions.push({
          id: `bq-${idx}-${Date.now()}`,
          question: parts[0],
          type: qType,
          required,
          options: options.length > 0 ? options : undefined,
        });
      }
    });

    if (questions.length > 0) {
      resultData.bookingQuestions = questions;
      parsedSectionsCount++;
    }
  }

  // ─── 24. SEO & METADATA ────────────────────────────────────────────────────
  const sec24 = ex.getSectionBlock('24') || ex.getSectionBlock('SEO');
  const ex24 = new SectionExtractor(sec24 || trimmed);

  const seoTitle = ex24.getField('(?:SEO_TITLE|META_TITLE)');
  const seoDesc = ex24.getBlock('(?:SEO_DESCRIPTION|META_DESCRIPTION)');
  const keywords = ex24.getField('KEYWORDS');

  if (seoTitle) {
    resultData.metaTitle = seoTitle;
    resultData.translations.en.seoTitle = seoTitle;
  }
  if (seoDesc) {
    resultData.metaDescription = seoDesc;
    resultData.translations.en.seoDescription = seoDesc;
  }
  if (keywords) resultData.keywords = parseCommaList(keywords);
  if (seoTitle || seoDesc) parsedSectionsCount++;

  // ─── 25. PUBLISHING & VISIBILITY ───────────────────────────────────────────
  const sec25 = ex.getSectionBlock('25') || ex.getSectionBlock('PUBLISHING');
  const ex25 = new SectionExtractor(sec25 || trimmed);

  const statusRaw = ex25.getField('STATUS') || ex.getField('STATUS');
  if (statusRaw) {
    const s = statusRaw.toUpperCase();
    if (['DRAFT', 'ACTIVE', 'HIDDEN', 'COMING_SOON', 'ARCHIVED'].includes(s)) {
      resultData.status = s as any;
      parsedSectionsCount++;
    }
  }

  // ─── 26. ADVANCED & OPERATIONS ─────────────────────────────────────────────
  const sec26 = ex.getSectionBlock('26') || ex.getSectionBlock('ADVANCED');
  const ex26 = new SectionExtractor(sec26 || trimmed);
  const internalNotes = ex26.getBlock('INTERNAL_NOTES');
  if (internalNotes) {
    resultData.internalNotes = internalNotes;
    resultData.translations.en.internalNotes = internalNotes;
    parsedSectionsCount++;
  }

  // Calculate completeness score
  const completeness = calculateTourCompleteness(resultData).score;

  return {
    data: resultData,
    errors,
    warnings,
    completeness,
    parsedSectionsCount,
  };
}
