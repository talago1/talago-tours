import type { Metadata } from 'next';
import { type LanguageCode, LANGUAGES } from './i18n';

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

export const BRAND_OG_IMAGE = `${APP_BASE_URL}/og/default.jpg`;

export function getOpenGraphLocale(lang: LanguageCode): string {
  switch (lang) {
    case 'de': return 'de_DE';
    case 'ru': return 'ru_RU';
    case 'fr': return 'fr_FR';
    case 'it': return 'it_IT';
    case 'es': return 'es_ES';
    case 'pl': return 'pl_PL';
    case 'uk': return 'uk_UA';
    case 'en':
    default:
      return 'en_US';
  }
}

export function buildHreflangAlternates(canonicalPath: string): Record<string, string> {
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const baseCanonical = `${APP_BASE_URL}${cleanPath === '/' ? '' : cleanPath}`;
  
  const languages: Record<string, string> = {
    'x-default': baseCanonical,
  };

  for (const lang of LANGUAGES) {
    const separator = baseCanonical.includes('?') ? '&' : '?';
    languages[lang] = `${baseCanonical}${separator}lang=${lang}`;
  }

  return languages;
}

interface HomeCopy {
  title: string;
  description: string;
  keywords: string[];
}

const HOME_SEO: Record<LanguageCode, HomeCopy> = {
  en: {
    title: 'TALAGO | Tours, Activities & Experiences Worldwide',
    description:
      'Discover and book top-rated tours, unique activities, and unforgettable experiences worldwide — Egypt, Red Sea, Nile Valley, and beyond. Instant confirmation & flexible cancellation.',
    keywords: [
      'TALAGO',
      'tours and activities',
      'book experiences',
      'Egypt tours',
      'Red Sea excursions',
      'Hurghada tours',
      'desert safari',
      'tour booking platform',
    ],
  },
  de: {
    title: 'TALAGO | Touren, Aktivitäten & Erlebnisse weltweit',
    description:
      'Entdecken und buchen Sie erstklassige Touren, einzigartige Aktivitäten und unvergessliche Erlebnisse weltweit — Ägypten, Rotes Meer, Niltal und mehr. Sofortbestätigung.',
    keywords: [
      'TALAGO',
      'Touren und Aktivitäten',
      'Ägypten Ausflüge',
      'Hurghada Ausflüge',
      'Bootstouren Rotes Meer',
      'Wüstensafari',
      'Erlebnisse buchen',
    ],
  },
  ru: {
    title: 'TALAGO | Туры, экскурсии и впечатления по всему миру',
    description:
      'Откройте и забронируйте лучшие туры, уникальные экскурсии и незабываемые впечатления по всему миру — Египет, Красное море, долина Нила и не только. Мгновенное подтверждение.',
    keywords: [
      'Экскурсии в Египте',
      'Экскурсии Хургада',
      'Экскурсии Шарм-эль-Шейх',
      'Морские прогулки Египет',
      'Сафари на квадроциклах',
      'Дайвинг Красное море',
      'TALAGO',
    ],
  },
  fr: {
    title: 'TALAGO | Tours, Activités & Expériences dans le Monde',
    description:
      'Découvrez et réservez les meilleurs tours, activités uniques et expériences inoubliables dans le monde entier — Égypte, Mer Rouge, Vallée du Nil et plus encore. Confirmation instantanée.',
    keywords: [
      'TALAGO',
      'tours et activités',
      'Excursions Égypte',
      'Hurghada',
      'Croisières Mer Rouge',
      'Safari désert',
      'réservation expériences',
    ],
  },
  it: {
    title: 'TALAGO | Tour, Attività & Esperienze in Tutto il Mondo',
    description:
      'Scopri e prenota i migliori tour, attività uniche ed esperienze indimenticabili in tutto il mondo — Egitto, Mar Rosso, Valle del Nilo e altro. Conferma immediata.',
    keywords: [
      'TALAGO',
      'tour e attività',
      'Escursioni Egitto',
      'Hurghada',
      'Gite Mar Rosso',
      'Safari deserto',
      'prenotazione esperienze',
    ],
  },
  es: {
    title: 'TALAGO | Tours, Actividades & Experiencias en el Mundo',
    description:
      'Descubre y reserva los mejores tours, actividades únicas y experiencias inolvidables en todo el mundo — Egipto, Mar Rojo, Valle del Nilo y más. Confirmación instantánea.',
    keywords: [
      'TALAGO',
      'tours y actividades',
      'Excursiones Egipto',
      'Hurghada',
      'Barcos Mar Rojo',
      'Safari desierto',
      'reserva experiencias',
    ],
  },
  pl: {
    title: 'TALAGO | Wycieczki, Aktywności & Doświadczenia na Świecie',
    description:
      'Odkryj i zarezerwuj najlepsze wycieczki, wyjątkowe aktywności i niezapomniane doświadczenia na całym świecie — Egipt, Morze Czerwone, Dolina Nilu i więcej. Natychmiastowe potwierdzenie.',
    keywords: [
      'TALAGO',
      'wycieczki i aktywności',
      'Wycieczki Egipt',
      'Hurghada',
      'Rejsy Morze Czerwone',
      'Safari pustynia',
      'rezerwacja doświadczeń',
    ],
  },
  uk: {
    title: 'TALAGO | Тури, Активності & Враження по всьому світу',
    description:
      'Відкрийте та забронюйте найкращі тури, унікальні активності та незабутні враження по всьому світу — Єгипет, Червоне море, Долина Нілу та більше. Миттєве підтвердження.',
    keywords: [
      'TALAGO',
      'Тури та активності',
      'Екскурсії Єгипет',
      'Хургада',
      'Морські прогулянки',
      'Сафарі пустеля',
      'бронювання вражень',
    ],
  },
};

export function getHomeMetadata(lang: LanguageCode): Metadata {
  const copy = HOME_SEO[lang] || HOME_SEO.en;
  const canonicalUrl = APP_BASE_URL;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: buildHreflangAlternates('/'),
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${APP_BASE_URL}${lang === 'en' ? '' : `?lang=${lang}`}`,
      siteName: 'TALAGO',
      locale: getOpenGraphLocale(lang),
      type: 'website',
      images: [
        {
          url: BRAND_OG_IMAGE,
          secureUrl: BRAND_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: copy.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [BRAND_OG_IMAGE],
    },
  };
}

const TOURS_SEO: Record<LanguageCode, { title: string; description: string }> = {
  en: {
    title: 'Tours & Excursions in Egypt',
    description:
      'Explore handpicked luxury yachts, private island charters, snorkeling, diving, desert safaris and historical temple tours across Egypt.',
  },
  de: {
    title: 'Touren & Ausflüge in Ägypten',
    description:
      'Entdecken Sie handverlesene Bootstouren, Yacht-Charter, Schnorcheln, Tauchen, Wüstensafaris und historische Tempeltouren in Ägypten.',
  },
  ru: {
    title: 'Экскурсии и туры в Египте',
    description:
      'Каталог проверенных экскурсий в Египте: морские прогулки на яхтах, снорклинг, дайвинг, сафари на квадроциклах и поездки в Каир и Луксор.',
  },
  fr: {
    title: 'Tours et Excursions en Égypte',
    description:
      'Découvrez notre sélection d’excursions en mer Rouge, croisières privées en yacht, plongée, safaris dans le désert et visites culturelles.',
  },
  it: {
    title: 'Tour ed Escursioni in Egitto',
    description:
      'Esplora le migliori escursioni in Egitto: crociere in barca, snorkeling, immersioni nel Mar Rosso, safari nel deserto e visite a Luxor e Cairo.',
  },
  es: {
    title: 'Tours y Excursiones en Egipto',
    description:
      'Explore excursiones exclusivas en Egipto: paseos en yate, snorkel, buceo, safaris por el desierto y visitas históricas a templos y pirámides.',
  },
  pl: {
    title: 'Wycieczki i Atrakcje w Egipcie',
    description:
      'Przeglądaj najlepsze wycieczki fakultatywne w Egipcie: rejsy jachtem, snorkeling, nurkowanie, safari na pustyni oraz wycieczki do Kairu i Luksoru.',
  },
  uk: {
    title: 'Екскурсії та тури в Єгипті',
    description:
      'Каталог найкращих екскурсій в Єгипті: морські прогулянки на яхтах, снорклінг, дайвінг, сафарі в пустелі та тури в Каїр і Луксор.',
  },
};

export function getToursMetadata(lang: LanguageCode): Metadata {
  const copy = TOURS_SEO[lang] || TOURS_SEO.en;
  const canonicalUrl = `${APP_BASE_URL}/tours`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildHreflangAlternates('/tours'),
    },
    openGraph: {
      title: `${copy.title} | TALAGO`,
      description: copy.description,
      url: `${canonicalUrl}${lang === 'en' ? '' : `?lang=${lang}`}`,
      siteName: 'TALAGO',
      locale: getOpenGraphLocale(lang),
      type: 'website',
      images: [
        {
          url: BRAND_OG_IMAGE,
          secureUrl: BRAND_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: copy.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${copy.title} | TALAGO`,
      description: copy.description,
      images: [BRAND_OG_IMAGE],
    },
  };
}

const DESTINATIONS_SEO: Record<LanguageCode, { title: string; description: string }> = {
  en: {
    title: 'Destinations Worldwide',
    description:
      'Browse all destinations — Hurghada, Sharm El Sheikh, Cairo, Luxor, and more. Curated tours, activities, and experiences with instant confirmation by TALAGO.',
  },
  de: {
    title: 'Reiseziele weltweit',
    description:
      'Erkunden Sie alle Reiseziele — Hurghada, Sharm El Sheikh, Kairo, Luxor und mehr. Handverlesene Touren und Erlebnisse mit sofortiger Bestaetigung durch TALAGO.',
  },
  ru: {
    title: 'Направления по всему миру',
    description:
      'Просматривайте все направления: Хургада, Шарм-эль-Шейх, Каир, Луксор и многое другое. Экскурсии и туры с мгновенным подтверждением от TALAGO.',
  },
  fr: {
    title: 'Destinations Mondiales',
    description:
      'Parcourez toutes les destinations — Hurghada, Charm el-Cheikh, Le Caire, Louxor et plus encore. Activites et experiences avec confirmation instantanee par TALAGO.',
  },
  it: {
    title: 'Destinazioni nel Mondo',
    description:
      'Esplora tutte le destinazioni — Hurghada, Sharm El Sheikh, Il Cairo, Luxor e altro. Tour ed esperienze con conferma immediata con TALAGO.',
  },
  es: {
    title: 'Destinos en el Mundo',
    description:
      'Explore todos los destinos: Hurghada, Sharm El Sheikh, El Cairo, Luxor y mas. Tours y experiencias con confirmacion instantanea con TALAGO.',
  },
  pl: {
    title: 'Kierunki Podrozy na Swiecie',
    description:
      'Przegladaj wszystkie kierunki — Hurghada, Sharm El Sheikh, Kair, Luksor i inne. Wycieczki i doswiadczenia z natychmiastowym potwierdzeniem od TALAGO.',
  },
  uk: {
    title: 'Напрямки по всьому світу',
    description:
      'Переглядайте всі напрямки: Хургада, Шарм-ель-Шейх, Каїр, Луксор та інші. Екскурсії та враження з миттєвим підтвердженням від TALAGO.',
  },
};
export function getDestinationsMetadata(lang: LanguageCode): Metadata {
  const copy = DESTINATIONS_SEO[lang] || DESTINATIONS_SEO.en;
  const canonicalUrl = `${APP_BASE_URL}/destinations`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildHreflangAlternates('/destinations'),
    },
    openGraph: {
      title: `${copy.title} | TALAGO`,
      description: copy.description,
      url: `${canonicalUrl}${lang === 'en' ? '' : `?lang=${lang}`}`,
      siteName: 'TALAGO',
      locale: getOpenGraphLocale(lang),
      type: 'website',
      images: [
        {
          url: BRAND_OG_IMAGE,
          secureUrl: BRAND_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: copy.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${copy.title} | TALAGO`,
      description: copy.description,
      images: [BRAND_OG_IMAGE],
    },
  };
}

export function buildDestinationDetailSEO(
  destName: string,
  destDescription: string | undefined,
  lang: LanguageCode,
  slug: string,
  imageUrl?: string | null,
): Metadata {
  const url = `${APP_BASE_URL}/destinations/${slug}`;

  let title = `${destName} Tours, Day Trips & Activities`;
  let description =
    destDescription ||
    `Discover and book the best ${destName} tours, boat excursions, desert safaris and experiences with TALAGO. Instant confirmation and best rates.`;

  switch (lang) {
    case 'de':
      title = `${destName} Ausflüge, Touren & Aktivitäten`;
      description =
        destDescription ||
        `Buchen Sie die besten Ausflüge in ${destName}: Bootstouren, Wüstensafaris, Schnorcheln und private Touren mit TALAGO. Sofortige Bestätigung.`;
      break;
    case 'ru':
      title = `Экскурсии в ${destName} | Туры и морские прогулки`;
      description =
        destDescription ||
        `Лучшие экскурсии и туры в ${destName}: морские прогулки на острова, дайвинг, сафари на квадроциклах и индивидуальные гиды с TALAGO.`;
      break;
    case 'fr':
      title = `Excursions à ${destName} | Visites et Activités`;
      description =
        destDescription ||
        `Réservez les meilleures excursions à ${destName}: sorties en bateau, plongée, safaris dans le désert et visites guidées avec TALAGO.`;
      break;
    case 'it':
      title = `Escursioni a ${destName} | Tour e Attività`;
      description =
        destDescription ||
        `Prenota le migliori escursioni a ${destName}: gite in barca, snorkeling, safari nel deserto e tour guidati con TALAGO. Conferma immediata.`;
      break;
    case 'es':
      title = `Excursiones en ${destName} | Tours y Actividades`;
      description =
        destDescription ||
        `Reserve las mejores excursiones en ${destName}: paseos en barco por el Mar Rojo, safaris por el desierto y tours con TALAGO.`;
      break;
    case 'pl':
      title = `Wycieczki w ${destName} | Atrakcje i Rejsy`;
      description =
        destDescription ||
        `Zarezerwuj najlepsze wycieczki w ${destName}: rejsy statkiem, snorkeling, safari na pustyni i wycieczki fakultatywne z TALAGO.`;
      break;
    case 'uk':
      title = `Екскурсії в ${destName} | Тури та активності`;
      description =
        destDescription ||
        `Найкращі екскурсії та тури в ${destName}: морські круїзи, снорклінг, сафарі в пустелі та індивідуальні тури з TALAGO.`;
      break;
  }

  const ogImage = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : `${APP_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
    : BRAND_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildHreflangAlternates(`/destinations/${slug}`),
    },
    openGraph: {
      title: `${title} | TALAGO`,
      description,
      url: `${url}${lang === 'en' ? '' : `?lang=${lang}`}`,
      siteName: 'TALAGO',
      locale: getOpenGraphLocale(lang),
      type: 'website',
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: `${destName} Tours`,
          type: ogImage.endsWith('.png') ? 'image/png' : 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | TALAGO`,
      description,
      images: [ogImage],
    },
  };
}

export function buildTourDetailSEO(params: {
  title: string;
  description: string;
  slug: string;
  coverImage?: string | null;
  destinationName?: string | null;
  lang: LanguageCode;
  price?: number | null;
  currency?: string;
  keywords?: string[];
}): Metadata {
  const { title, description, slug, coverImage, destinationName, lang, price, currency = 'USD', keywords } = params;
  const pageUrl = `${APP_BASE_URL}/tours/${slug}`;

  const resolvedImage = coverImage || BRAND_OG_IMAGE;
  const absoluteImage = resolvedImage.startsWith('http')
    ? resolvedImage
    : `${APP_BASE_URL}${resolvedImage.startsWith('/') ? '' : '/'}${resolvedImage}`;

  const formattedTitle = destinationName
    ? `${title} — ${destinationName} | TALAGO`
    : `${title} | TALAGO`;

  const mimeType = absoluteImage.endsWith('.png')
    ? 'image/png'
    : absoluteImage.endsWith('.webp')
    ? 'image/webp'
    : 'image/jpeg';

  return {
    title: formattedTitle,
    description,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: pageUrl,
      languages: buildHreflangAlternates(`/tours/${slug}`),
    },
    openGraph: {
      title: formattedTitle,
      description,
      url: `${pageUrl}${lang === 'en' ? '' : `?lang=${lang}`}`,
      siteName: 'TALAGO Tours',
      locale: getOpenGraphLocale(lang),
      type: 'website',
      images: [
        {
          url: absoluteImage,
          secureUrl: absoluteImage,
          width: 1200,
          height: 630,
          alt: title,
          type: mimeType,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: formattedTitle,
      description,
      images: [absoluteImage],
    },
    other: price
      ? {
          'product:price:amount': String(price),
          'product:price:currency': currency,
        }
      : undefined,
  };
}

