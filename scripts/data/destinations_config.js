const DESTINATIONS = [
  {
    slug: 'hurghada',
    name: 'Hurghada',
    description: 'Premier Red Sea resort capital famous for crystal lagoons, Giftun islands, diving, and desert safaris.',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    latitude: 27.2579,
    longitude: 33.8116,
    translations: {
      en: { name: 'Hurghada', description: 'Premier Red Sea resort capital famous for crystal lagoons and Giftun islands.' },
      de: { name: 'Hurghada', description: 'Ägyptens beliebtestes Urlaubsziel am Roten Meer für Tauchen und Bootstouren.' },
      ru: { name: 'Хургада', description: 'Главный курорт Красного моря с коралловыми островами и дайвингом.' },
      fr: { name: 'Hurghada', description: 'Capitale balnéaire de la Mer Rouge, réputée pour ses îles et plongées.' },
      it: { name: 'Hurghada', description: 'Capitale del Mar Rosso famosa per barriere coralline e crociere.' },
      pl: { name: 'Hurghada', description: 'Stolica kurortowa Morza Czerwonego słynąca z wysp Giftun.' },
      es: { name: 'Hurgada', description: 'Capital del Mar Rojo famosa por sus arrecifes de coral e islas.' },
    },
  },
  {
    slug: 'sharm-el-sheikh',
    name: 'Sharm El Sheikh',
    description: 'The City of Peace on the Sinai Peninsula, home to Ras Mohamed and Mount Sinai.',
    imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    latitude: 27.9158,
    longitude: 34.3299,
    translations: {
      en: { name: 'Sharm El Sheikh', description: 'Sinai jewel home to Ras Mohamed and Mount Sinai.' },
      de: { name: 'Scharm El-Scheich', description: 'Das Juwel des Sinai mit Ras Mohamed Nationalpark.' },
      ru: { name: 'Шарм-эль-Шейх', description: 'Жемчужина Синая с заповедником Рас Мохаммед.' },
      fr: { name: 'Charm el-Cheikh', description: 'Perle du Sinaï et sanctuaire marin de Ras Mohamed.' },
      it: { name: 'Sharm el-Sheikh', description: 'Perla del Sinai con il parco marino di Ras Mohamed.' },
      pl: { name: 'Szarm el-Szejk', description: 'Perła Synaju z rezerwatem Ras Mohamed.' },
      es: { name: 'Sharm el-Sheij', description: 'Joya del Sinaí con el Parque Nacional Ras Mohamed.' },
    },
  },
  {
    slug: 'marsa-alam',
    name: 'Marsa Alam',
    description: 'Egypt’s premier eco-paradise world-renowned for sea turtles, dugongs, and wild spinner dolphins.',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80',
    latitude: 25.0676,
    longitude: 34.8790,
    translations: {
      en: { name: 'Marsa Alam', description: 'Eco-paradise famous for Sataya Dolphin Reef and Abu Dabbab dugongs.' },
      de: { name: 'Marsa Alam', description: 'Ökoparadies für freilebende Delfine und Seekühe.' },
      ru: { name: 'Марса Алам', description: 'Эко-заповедник с дикими дельфинами Сатая и морскими коровами.' },
      fr: { name: 'Marsa Alam', description: 'Paradis écologique des dauphins sauvages et dugongs.' },
      it: { name: 'Marsa Alam', description: 'Paradiso naturale per delfini selvatici e dugonghi.' },
      pl: { name: 'Marsa Alam', description: 'Dziki raj morski z delfinami Sataya i żółwiami.' },
      es: { name: 'Marsa Alam', description: 'Paraíso ecológico famoso por sus delfines salvajes.' },
    },
  },
  {
    slug: 'luxor',
    name: 'Luxor',
    description: 'The world’s greatest open-air museum, holding Valley of the Kings and Karnak Temple.',
    imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200&q=80',
    latitude: 25.6872,
    longitude: 32.6396,
    translations: {
      en: { name: 'Luxor', description: 'The open-air museum with Valley of the Kings and Karnak.' },
      de: { name: 'Luxor', description: 'Größtes Freilichtmuseum der Welt mit dem Tal der Könige.' },
      ru: { name: 'Луксор', description: 'Величайший музей под открытым небом: Долина Царей и Карнак.' },
      fr: { name: 'Louxor', description: 'Le plus grand musée à ciel ouvert avec la Vallée des Rois.' },
      it: { name: 'Luxor', description: 'Il più grande museo a cielo aperto con la Valle dei Re.' },
      pl: { name: 'Luksor', description: 'Największe muzeum: Dolina Królów i Karnak.' },
      es: { name: 'Lúxor', description: 'El mayor museo al aire libre con el Valle de los Reyes.' },
    },
  },
  {
    slug: 'cairo',
    name: 'Cairo',
    description: 'The Great Pyramids of Giza, the Sphinx, and the Grand Egyptian Museum.',
    imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
    latitude: 30.0444,
    longitude: 31.2357,
    translations: {
      en: { name: 'Cairo & Pyramids', description: 'Home to the Great Pyramids of Giza and the Sphinx.' },
      de: { name: 'Kairo & Pyramiden', description: 'Heimat der Pyramiden von Gizeh und der Sphinx.' },
      ru: { name: 'Каир и Пирамиды', description: 'Великие пирамиды Гизы, Сфинкс и Египетский музей.' },
      fr: { name: 'Le Caire', description: 'Les grandes pyramides de Gizeh et le Sphinx.' },
      it: { name: 'Il Cairo', description: 'Le grandi piramidi di Giza e la Sfinge.' },
      pl: { name: 'Kair i Piramidy', description: 'Wielkie Piramidy w Gizie i Sfinks.' },
      es: { name: 'El Cairo', description: 'Las Grandes Pirámides de Guiza y la Esfinge.' },
    },
  },
];

async function ensureDestinations(prismaClient) {
  const prisma = prismaClient || require('@prisma/client').PrismaClient && new (require('@prisma/client').PrismaClient)();
  const map = {};
  for (const d of DESTINATIONS) {
    const record = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    });
    map[d.slug] = record;
  }
  return map;
}

module.exports = { ensureDestinations, DESTINATIONS };