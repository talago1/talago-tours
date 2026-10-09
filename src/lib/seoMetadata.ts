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
    title: 'TALAGO | Egypt Tours & Experiences | Red Sea & Nile',
    description:
      'Book vetted Egypt tours and experiences across the Red Sea, Nile and desert — Hurghada, Sharm El Sheikh, Marsa Alam, Cairo and Luxor. Instant confirmation.',
    keywords: [
      'Egypt tours',
      'Egypt excursions',
      'Hurghada tours',
      'Sharm El Sheikh excursions',
      'Marsa Alam boat trips',
      'Cairo day tours',
      'Luxor temple tours',
      'Desert safari Egypt',
      'TALAGO',
    ],
  },
  de: {
    title: 'TALAGO | Ägypten Ausflüge, Touren & Erlebnisse | Rotes Meer & Nil',
    description:
      'Buchen Sie erstklassige Ausflüge und Touren in Ägypten — Hurghada, Sharm El Sheikh, Marsa Alam, Kairo und Luxor. Bootstouren, Wüstensafari & Tauchen mit Sofortbestätigung.',
    keywords: [
      'Ägypten Ausflüge',
      'Hurghada Ausflüge',
      'Sharm El Sheikh Touren',
      'Marsa Alam Ausflüge',
      'Bootstouren Rotes Meer',
      'Wüstensafari Ägypten',
      'Kairo Tagesausflug',
      'TALAGO',
    ],
  },
  ru: {
    title: 'TALAGO | Экскурсии в Египте, морские прогулки и сафари',
    description:
      'Бронируйте проверенные экскурсии и туры по Египту — Хургада, Шарм-эль-Шейх, Марса Алам, Каир и Луксор. Морские прогулки, дайвинг, сафари с мгновенным подтверждением.',
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
    title: 'TALAGO | Excursions en Égypte, Croisières Mer Rouge & Safaris',
    description:
      'Réservez les meilleures excursions et activités en Égypte — Hurghada, Charm el-Cheikh, Marsa Alam, Le Caire et Louxor. Sorties bateau, plongée et safaris avec confirmation immédiate.',
    keywords: [
      'Excursions Égypte',
      'Excursions Hurghada',
      'Visites Charm el-Cheikh',
      'Croisières Mer Rouge',
      'Safari désert Égypte',
      'Plongée Égypte',
      'TALAGO',
    ],
  },
  it: {
    title: 'TALAGO | Escursioni in Egitto, Tour Mar Rosso & Safari nel Deserto',
    description:
      'Prenota le migliori escursioni e tour in Egitto — Hurghada, Sharm El Sheikh, Marsa Alam, Il Cairo e Luxor. Gite in barca, immersioni e safari con conferma immediata.',
    keywords: [
      'Escursioni Egitto',
      'Escursioni Hurghada',
      'Tour Sharm El Sheikh',
      'Gite in barca Mar Rosso',
      'Safari deserto Egitto',
      'Immersioni Egitto',
      'TALAGO',
    ],
  },
  es: {
    title: 'TALAGO | Excursiones en Egipto, Tours en Mar Rojo y Safaris',
    description:
      'Reserve las mejores excursiones y tours en Egipto — Hurghada, Sharm El Sheikh, Marsa Alam, El Cairo y Luxor. Paseos en barco, buceo y safaris con confirmación inmediata.',
    keywords: [
      'Excursiones Egipto',
      'Excursiones Hurghada',
      'Tours Sharm El Sheikh',
      'Barcos Mar Rojo',
      'Safari desierto Egipto',
      'Buceo Egipto',
      'TALAGO',
    ],
  },
  pl: {
    title: 'TALAGO | Wycieczki w Egipcie, Rejsy po Morzu Czerwonym i Safari',
    description:
      'Rezerwuj sprawdzone wycieczki i atrakcje w Egipcie — Hurghada, Sharm El Sheikh, Marsa Alam, Kair i Luksor. Rejsy statkiem, nurkowanie i safari na pustyni z natychmiastowym potwierdzeniem.',
    keywords: [
      'Wycieczki Egipt',
      'Wycieczki Hurghada',
      'Wycieczki Sharm El Sheikh',
      'Rejsy Morze Czerwone',
      'Safari pustynia Egipt',
      'Nurkowanie Egipt',
      'TALAGO',
    ],
  },
  uk: {
    title: 'TALAGO | Екскурсії в Єгипті, морські прогулянки та сафарі',
    description:
      'Бронюйте перевірені екскурсії та тури в Єгипті — Хургада, Шарм-ель-Шейх, Марса Алам, Каїр і Луксор. Морські прогулянки, дайвінг та сафарі з миттєвим підтвердженням.',
    keywords: [
      'Екскурсії Єгипет',
      'Екскурсії Хургада',
      'Тури Шарм-ель-Шейх',
      'Морські прогулянки',
      'Сафарі Єгипет',
      'Дайвінг Єгипет',
      'TALAGO',
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
    title: 'Egypt Travel Destinations',
    description:
      'Explore Egypt by destination — Hurghada, Sharm El Sheikh, Marsa Alam, El Gouna, Cairo, Luxor, Aswan and more. Curated tours and activities with TALAGO.',
  },
  de: {
    title: 'Reiseziele in Ägypten',
    description:
      'Erkunden Sie Ägypten nach Reisezielen — Hurghada, Sharm El Sheikh, Marsa Alam, El Gouna, Kairo, Luxor und Assuan. Handverlesene Touren mit TALAGO.',
  },
  ru: {
    title: 'Туристические направления в Египте',
    description:
      'Исследуйте Египет по направлениям: Хургада, Шарм-эль-Шейх, Марса Алам, Эль-Гуна, Каир, Луксор и Асуан. Экскурсии и туры с TALAGO.',
  },
  fr: {
    title: 'Destinations de Voyage en Égypte',
    description:
      'Explorez l’Égypte par destination — Hurghada, Charm el-Cheikh, Marsa Alam, El Gouna, Le Caire, Louxor et Assouan. Visites guidées avec TALAGO.',
  },
  it: {
    title: 'Destinazioni Turistiche in Egitto',
    description:
      'Esplora l’Egitto per destinazione — Hurghada, Sharm El Sheikh, Marsa Alam, El Gouna, Il Cairo, Luxor e Assuan. Tour selezionati con TALAGO.',
  },
  es: {
    title: 'Destinos Turísticos en Egipto',
    description:
      'Explore Egipto por destino: Hurghada, Sharm El Sheikh, Marsa Alam, El Gouna, El Cairo, Luxor y Asuán. Tours exclusivos con TALAGO.',
  },
  pl: {
    title: 'Kierunki Podróży w Egipcie',
    description:
      'Odkrywaj Egipt według kierunków: Hurghada, Sharm El Sheikh, Marsa Alam, El Gouna, Kair, Luksor i Asuan. Wycieczki i rejsy z TALAGO.',
  },
  uk: {
    title: 'Туристичні напрямки в Єгипті',
    description:
      'Досліджуйте Єгипет за напрямками: Хургада, Шарм-ель-Шейх, Марса Алам, Ель-Гуна, Каїр, Луксор та Асуан. Екскурсії та враження з TALAGO.',
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

