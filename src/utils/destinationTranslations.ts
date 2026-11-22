/**
 * Canonical localized destination & category names across all 8 supported languages:
 * en, de, ru, fr, it, pl, es, uk.
 */

export const DESTINATION_TRANSLATIONS: Record<string, Record<string, string>> = {
  hurghada: {
    en: 'Hurghada',
    de: 'Hurghada',
    ru: 'Хургада',
    uk: 'Хургада',
    fr: 'Hurghada',
    it: 'Hurghada',
    pl: 'Hurghada',
    es: 'Hurgada',
  },
  'sharm-el-sheikh': {
    en: 'Sharm El Sheikh',
    de: 'Scharm El-Scheich',
    ru: 'Шарм-эль-Шейх',
    uk: 'Шарм-ель-Шейх',
    fr: 'Charm el-Cheikh',
    it: 'Sharm El Sheikh',
    pl: 'Szarm el-Szejk',
    es: 'Sharm el-Sheij',
  },
  'marsa-alam': {
    en: 'Marsa Alam',
    de: 'Marsa Alam',
    ru: 'Марса-Алам',
    uk: 'Марса-Алам',
    fr: 'Marsa Alam',
    it: 'Marsa Alam',
    pl: 'Marsa Alam',
    es: 'Marsa Alam',
  },
  cairo: {
    en: 'Cairo',
    de: 'Kairo',
    ru: 'Каир',
    uk: 'Каїр',
    fr: 'Le Caire',
    it: 'Il Cairo',
    pl: 'Kair',
    es: 'El Cairo',
  },
  luxor: {
    en: 'Luxor',
    de: 'Luxor',
    ru: 'Луксор',
    uk: 'Луксор',
    fr: 'Louxor',
    it: 'Luxor',
    pl: 'Luksor',
    es: 'Lúxor',
  },
  egypt: {
    en: 'Egypt',
    de: 'Ägypten',
    ru: 'Египет',
    uk: 'Єгипет',
    fr: 'Égypte',
    it: 'Egitto',
    pl: 'Egipt',
    es: 'Egipto',
  },
  'red-sea': {
    en: 'Red Sea',
    de: 'Rotes Meer',
    ru: 'Красное море',
    uk: 'Червоне море',
    fr: 'Mer Rouge',
    it: 'Mar Rosso',
    pl: 'Morze Czerwone',
    es: 'Mar Rojo',
  },
};

export const CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  watersports: {
    en: 'Water Sports',
    de: 'Wassersport',
    ru: 'Водные виды спорта',
    uk: 'Водні види спорту',
    fr: 'Sports nautiques',
    it: 'Sport acquatici',
    pl: 'Sporty wodne',
    es: 'Deportes acuáticos',
  },
  adventure: {
    en: 'Adventure & Outdoor',
    de: 'Abenteuer & Outdoor',
    ru: 'Приключения и активный отдых',
    uk: 'Пригоди та активний відпочинок',
    fr: 'Aventure & Plein air',
    it: 'Avventura e attività all’aperto',
    pl: 'Przygoda i outdoor',
    es: 'Aventura y actividades al aire libre',
  },
  snorkeling: {
    en: 'Snorkeling & Coral Reefs',
    de: 'Schnorcheln & Riffe',
    ru: 'Снорклинг и рифы',
    uk: 'Снорклінг та коралові рифи',
    fr: 'Snorkeling & récifs',
    it: 'Snorkeling e barriere',
    pl: 'Snurkowanie i rafy',
    es: 'Esnórquel y arrecifes',
  },
  safari: {
    en: 'Desert Safari & Quads',
    de: 'Wüstensafari & Quads',
    ru: 'Сафари и квадроциклы',
    uk: 'Сафарі в пустелі та квадроцикли',
    fr: 'Safari dans le désert & quads',
    it: 'Safari e quad',
    pl: 'Safari na pustyni i quady',
    es: 'Safari y quads',
  },
  sea: {
    en: 'Boat & Yacht Cruises',
    de: 'Boot- & Yachtfahrten',
    ru: 'Морские прогулки и яхты',
    uk: 'Морські прогулянки та яхти',
    fr: 'Croisières en bateau et yacht',
    it: 'Gite in barca e yacht',
    pl: 'Rejsy łodzią i jachtem',
    es: 'Cruceros en barco y yate',
  },
  cultural: {
    en: 'Cultural & Historical Tours',
    de: 'Kultur & Geschichte',
    ru: 'Культура и история',
    uk: 'Культурні та історичні тури',
    fr: 'Culture & Histoire',
    it: 'Cultura e storia',
    pl: 'Kultura i historia',
    es: 'Cultura e historia',
  },
  diving: {
    en: 'Scuba Diving',
    de: 'Gerätetauchen',
    ru: 'Дайвинг с аквалангом',
    uk: 'Дайвінг з аквалангом',
    fr: 'Plongée sous-marine',
    it: 'Immersioni subacquee',
    pl: 'Nurkowanie z akwalungiem',
    es: 'Buceo con botella',
  },
  'day-trips': {
    en: 'Full-Day Excursions',
    de: 'Ganztagesausflüge',
    ru: 'Однодневные экскурсии',
    uk: 'Одноденні екскурсії',
    fr: "Excursions d'une journée",
    it: 'Escursioni giornaliere',
    pl: 'Wycieczki całodniowe',
    es: 'Excursiones de día',
  },
  private: {
    en: 'Private Charters & VIP',
    de: 'Private Charter & VIP',
    ru: 'Индивидуальные туры & VIP',
    uk: 'Приватні чартери та VIP',
    fr: 'Charters privés & VIP',
    it: 'Charter privati & VIP',
    pl: 'Prywatne czartery & VIP',
    es: 'Chárteres privados & VIP',
  },
  spa: {
    en: 'Spa & Wellness',
    de: 'Spa & Wellness',
    ru: 'Спа и оздоровление',
    uk: 'Спа та оздоровлення',
    fr: 'Spa & Bien-être',
    it: 'Spa e benessere',
    pl: 'Spa i odnowa biologiczna',
    es: 'Spa y bienestar',
  },
  entertainment: {
    en: 'Shows & Entertainment',
    de: 'Shows & Unterhaltung',
    ru: 'Шоу и развлечения',
    uk: 'Шоу та розваги',
    fr: 'Spectacles et divertissements',
    it: 'Spettacoli e intrattenimento',
    pl: 'Pokazy i rozrywka',
    es: 'Espectáculos y entretenimiento',
  },
};

export function getLocalizedDestinationName(
  slug?: string | null,
  lang: string = 'en',
  fallback?: string
): string {
  if (!slug) return fallback || '';
  const key = slug.toLowerCase().trim();
  const entry = DESTINATION_TRANSLATIONS[key];
  if (entry) {
    return entry[lang] || entry['en'] || fallback || slug;
  }
  return fallback || slug;
}

export function getLocalizedCategoryName(
  rawCategory?: string | null,
  lang: string = 'en',
  dict?: any
): string {
  if (!rawCategory) return '';
  const clean = rawCategory.trim();
  const lower = clean.toLowerCase().replace(/[\s_-]+/g, '');

  let lookupKey = 'sea';
  if (lower.includes('watersport')) lookupKey = 'watersports';
  else if (lower.includes('adventure') || lower.includes('outdoor')) lookupKey = 'adventure';
  else if (lower.includes('snorkeling') || lower.includes('reef')) lookupKey = 'snorkeling';
  else if (lower.includes('diving') || lower.includes('scuba')) lookupKey = 'diving';
  else if (lower.includes('safari') || lower.includes('desert') || lower.includes('quad')) lookupKey = 'safari';
  else if (lower.includes('cultural') || lower.includes('historical') || lower.includes('pyramid') || lower.includes('temple')) lookupKey = 'cultural';
  else if (lower.includes('daytrip') || lower.includes('excursion')) lookupKey = 'day-trips';
  else if (lower.includes('private') || lower.includes('vip') || lower.includes('charter')) lookupKey = 'private';
  else if (lower.includes('spa') || lower.includes('wellness') || lower.includes('hammam')) lookupKey = 'spa';
  else if (lower.includes('entertainment') || lower.includes('show')) lookupKey = 'entertainment';
  else if (lower.includes('boat') || lower.includes('sea') || lower.includes('cruise') || lower.includes('yacht')) lookupKey = 'sea';
  else {
    // If not matched to standard categories, capitalize words gracefully
    return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/_/g, ' ');
  }

  // Check dictionary first if available
  if (dict?.interests?.[lookupKey]) return dict.interests[lookupKey];
  if (dict?.catalog?.[lookupKey]) return dict.catalog[lookupKey];

  // Fallback to table
  const entry = CATEGORY_TRANSLATIONS[lookupKey];
  if (entry) {
    return entry[lang] || entry['en'] || clean;
  }

  return clean;
}
