const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

const additions = {
  de: {
    popularDestinations: 'Beliebte Reiseziele',
    popularDestinationsSubtitle: 'Entdecken Sie Ägyptens schönste Regionen am Roten Meer, im Niltal und in den Oasen.',
    tagline: 'Erstklassige Touren in ganz Ägypten, luxuriöse Bootsausflüge auf dem Roten Meer und Wüstensafaris mit exzellentem Service.',
  },
  ru: {
    popularDestinations: 'Популярные направления',
    popularDestinationsSubtitle: 'Исследуйте знаковые регионы Египта: Красное море, долину Нила и оазисы пустыни.',
    tagline: 'Проверенные туры по всему Египту, морские прогулки на яхтах по Красному морю и премиальные сафари в пустыне.',
  },
  it: {
    popularDestinations: 'Destinazioni Popolari',
    popularDestinationsSubtitle: 'Esplora le regioni più iconiche dell’Egitto tra Mar Rosso, Valle del Nilo e oasi nel deserto.',
    tagline: 'Tour verificati in tutto l’Egitto, escursioni in yacht sul Mar Rosso e safari nel deserto con ospitalità d’élite.',
  },
  fr: {
    popularDestinations: 'Destinations Populaires',
    popularDestinationsSubtitle: 'Explorez les régions emblématiques d’Égypte entre la mer Rouge, la vallée du Nil et les oasis du désert.',
    tagline: 'Circuits d’exception dans toute l’Égypte, excursions en yacht de luxe sur la mer Rouge et safaris dans le désert.',
  },
  pl: {
    popularDestinations: 'Popularne Kierunki',
    popularDestinationsSubtitle: 'Odkryj najbardziej znane regiony Egiptu: Morze Czerwone, Dolinę Nilu i oazy pustynne.',
    tagline: 'Sprawdzone wycieczki po całym Egipcie, luksusowe rejsy jachtami po Morzu Czerwonym i wyprawy na pustynię.',
  },
  es: {
    popularDestinations: 'Destinos Populares',
    popularDestinationsSubtitle: 'Descubra las regiones más emblemáticas de Egipto a través del Mar Rojo, el Valle del Nilo y los oasis del desierto.',
    tagline: 'Tours verificados en todo Egipto, excursiones en yates de lujo por el Mar Rojo y safaris en el desierto con hospitalidad de élite.',
  },
};

for (const [lang, data] of Object.entries(additions)) {
  const filePath = path.join(localesDir, `${lang}.ts`);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Insert popularDestinations if missing in catalog
  if (!content.includes('popularDestinations:')) {
    const target = /viewAllDestinations:\s*['"][^'"]+['"],?/;
    const match = content.match(target);
    if (match) {
      const replacement = `${match[0]}\n    popularDestinations: '${data.popularDestinations}',\n    popularDestinationsSubtitle: '${data.popularDestinationsSubtitle}',`;
      content = content.replace(match[0], replacement);
    }
  }

  // Update footer tagline if it has Hurghada-only copy
  content = content.replace(
    /tagline:\s*['"][^'"]*(?:Hurghada|Hurgada)[^'"]*['"]/i,
    `tagline: '${data.tagline}'`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Updated ${lang}.ts`);
}
