/**
 * Homepage Collections & Discovery Experience Configuration
 * Stored in SystemSetting key: "homepage_collections"
 */

export interface HomepageCollectionConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: 'featured' | 'destination' | 'category' | 'popular';
  targetSlug?: string; // destination slug or category name
  enabled: boolean;
  maxItems: number;
  viewAllLink?: string;
  order: number;
  translations?: Record<string, { title: string; subtitle?: string }>;
}

export const DEFAULT_HOMEPAGE_COLLECTIONS: HomepageCollectionConfig[] = [
  {
    id: 'top-experiences',
    title: 'Top Experiences in Egypt',
    subtitle: 'Handpicked and most popular activities with verified reviews',
    type: 'featured',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?sort=popular',
    order: 0,
    translations: {
      de: { title: 'Top-Erlebnisse in Ägypten', subtitle: 'Handverlesene und beliebteste Aktivitäten mit verifizierten Bewertungen' },
      ru: { title: 'Лучшие экскурсии в Египте', subtitle: 'Отборные и самые популярные программы с проверенными отзывами' },
      fr: { title: 'Meilleures expériences en Égypte', subtitle: 'Activités sélectionnées et très prisées avec avis vérifiés' },
      it: { title: 'Migliori esperienze in Egitto', subtitle: 'Attività selezionate e più popolari con recensioni verificate' },
      pl: { title: 'Najlepsze atrakcje w Egipcie', subtitle: 'Wybrane i najpopularniejsze wycieczki ze sprawdzonymi opiniami' },
      es: { title: 'Mejores experiencias en Egipto', subtitle: 'Actividades seleccionadas y populares con opiniones verificadas' },
    },
  },
  {
    id: 'hurghada',
    title: 'Things to Do in Hurghada',
    subtitle: 'Crystal reefs, Giftun Island boat trips & Sahara quad safaris',
    type: 'destination',
    targetSlug: 'hurghada',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?destination=hurghada',
    order: 1,
    translations: {
      de: { title: 'Aktivitäten in Hurghada', subtitle: 'Kristallklare Riffe, Giftun-Insel-Bootstouren und Quad-Safaris' },
      ru: { title: 'Чем заняться в Хургаде', subtitle: 'Коралловые рифы, морские прогулки на остров Гифтун и сафари на квадроциклах' },
      fr: { title: 'Choses à faire à Hurghada', subtitle: 'Récifs de corail, sorties en bateau vers l\'île Giftoun et safaris en quad' },
      it: { title: 'Cosa fare a Hurghada', subtitle: 'Barriere coralline, gite in barca all\'isola Giftun e safari in quad nel deserto' },
      pl: { title: 'Co robić w Hurghadzie', subtitle: 'Rafy koralowe, rejsy na wyspę Giftun i safari na quadach po Saharze' },
      es: { title: 'Qué hacer en Hurghada', subtitle: 'Arrecifes cristalinos, excursiones en barco a la isla Giftun y safaris en quad' },
    },
  },
  {
    id: 'sharm-el-sheikh',
    title: 'Things to Do in Sharm El Sheikh',
    subtitle: 'World-renowned diving at Ras Mohammed & Sinai mountain treks',
    type: 'destination',
    targetSlug: 'sharm-el-sheikh',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?destination=sharm-el-sheikh',
    order: 2,
    translations: {
      de: { title: 'Aktivitäten in Sharm El Sheikh', subtitle: 'Weltbekanntes Tauchen in Ras Mohammed & Sinai-Bergtouren' },
      ru: { title: 'Чем заняться в Шарм-эль-Шейхе', subtitle: 'Мировой дайвинг в Рас-Мохаммед и походы на гору Синай' },
      fr: { title: 'Choses à faire à Charm el-Cheikh', subtitle: 'Plongée renommée à Ras Mohammed et randonnées au mont Sinaï' },
      it: { title: 'Cosa fare a Sharm El Sheikh', subtitle: 'Immersioni famose a Ras Mohammed ed escursioni sul monte Sinai' },
      pl: { title: 'Co robić w Szarm el-Szejk', subtitle: 'Nurkowanie w Ras Mohammed i wyprawy w góry Synaj' },
      es: { title: 'Qué hacer en Sharm El Sheikh', subtitle: 'Buceo de clase mundial en Ras Mohammed y excursiones al Sinaí' },
    },
  },
  {
    id: 'marsa-alam',
    title: 'Things to Do in Marsa Alam',
    subtitle: 'Encounter sea turtles, pristine coral bays & dolphin reefs',
    type: 'destination',
    targetSlug: 'marsa-alam',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?destination=marsa-alam',
    order: 3,
    translations: {
      de: { title: 'Aktivitäten in Marsa Alam', subtitle: 'Meeresschildkröten beobachten, unberührte Buchten und Delfinriffe' },
      ru: { title: 'Чем заняться в Марса-Аламе', subtitle: 'Встречи с морскими черепахами, девственные бухты и рифы дельфинов' },
    },
  },
  {
    id: 'cairo',
    title: 'Things to Do in Cairo',
    subtitle: 'The Great Pyramids of Giza, Grand Museum & Nile dinner cruises',
    type: 'destination',
    targetSlug: 'cairo',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?destination=cairo',
    order: 4,
    translations: {
      de: { title: 'Aktivitäten in Kairo', subtitle: 'Die großen Pyramiden von Gizeh, das Grand Museum & Nil-Dinner-Kreuzfahrten' },
      ru: { title: 'Чем заняться в Каире', subtitle: 'Великие пирамиды Гизы, Большой музей и ужины на круизном лайнере по Нилу' },
    },
  },
  {
    id: 'luxor',
    title: 'Things to Do in Luxor',
    subtitle: 'Valley of the Kings, Karnak Temple & sunrise hot air balloons',
    type: 'destination',
    targetSlug: 'luxor',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?destination=luxor',
    order: 5,
    translations: {
      de: { title: 'Aktivitäten in Luxor', subtitle: 'Tal der Könige, Karnak-Tempel & Heißluftballonfahrten zum Sonnenaufgang' },
      ru: { title: 'Чем заняться в Луксоре', subtitle: 'Долина Царей, Карнакский храм и полёты на воздушном шаре на рассвете' },
    },
  },
  {
    id: 'sea-trips',
    title: 'Sea & Boat Trips',
    subtitle: 'Private catamarans, island hopping & semi-submarine coral tours',
    type: 'category',
    targetSlug: 'sea',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?type=sea',
    order: 6,
    translations: {
      de: { title: 'See- & Bootstouren', subtitle: 'Private Katamarane, Inselhüpfen und Halbtauchboot-Touren' },
      ru: { title: 'Морские прогулки и яхты', subtitle: 'Частные катамараны, круизы по островам и батискафы' },
    },
  },
  {
    id: 'safari',
    title: 'Desert & Safari Adventures',
    subtitle: 'Quad bikes, dune buggies, Bedouin tea & stargazing dinners',
    type: 'category',
    targetSlug: 'safari',
    enabled: true,
    maxItems: 8,
    viewAllLink: '/tours?type=safari',
    order: 7,
    translations: {
      de: { title: 'Wüsten- & Safari-Abenteuer', subtitle: 'Quads, Dünenbuggys, Beduinentee und Abendessen unter den Sternen' },
      ru: { title: 'Сафари и пустынные приключения', subtitle: 'Квадроциклы, багги, чай у бедуинов и ужин под звездами' },
    },
  },
];
