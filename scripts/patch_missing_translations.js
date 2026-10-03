const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Missing it/fr/pl/es translations for 6 tours
const PATCHES = [
  {
    slug: 'giftun-island-orange-bay-luxury-cruise',
    it: {
      title: 'Crociera VIP a Orange Bay Island con Snorkeling e Buffet di Pesce',
      cardExcerpt: 'Naviga verso la Caraibi egiziana! Rilassati su Orange Bay, fai snorkeling e gustati un buffet di pesce fresco.',
      description: 'Naviga a bordo di uno yacht di lusso verso Orange Bay sull\'isola di Giftun. Goditi 2 ore su spiagge incontaminate, 2 sessioni di snorkeling, sport acquatici e pranzo a buffet aperto.',
      itinerary: [
        { timeTag: '08:00', title: 'Partenza dall\'hotel', description: 'Transfer alla marina.' },
        { timeTag: '10:00', title: 'Orange Bay', description: '2 ore sulle spiagge di sabbia bianca.' },
        { timeTag: '12:30', title: 'Snorkeling e Pranzo', description: '2 sessioni di snorkeling guidate e buffet di pesce.' }
      ]
    },
    fr: {
      title: 'Croisière VIP à Orange Bay Island avec Snorkeling et Buffet de Fruits de Mer',
      cardExcerpt: 'Naviguez vers les Caraïbes égyptiennes! Détendez-vous sur Orange Bay et faites du snorkeling dans les récifs coralliens.',
      description: 'Croisière en yacht de luxe vers Orange Bay sur l\'île de Giftun. Profitez de 2h sur des plages immaculées, 2 sessions de snorkeling, sports nautiques et déjeuner buffet.',
      itinerary: [
        { timeTag: '08:00', title: 'Prise en charge à l\'hôtel', description: 'Transfer vers la marina.' },
        { timeTag: '10:00', title: 'Orange Bay', description: '2 heures sur les plages de sable blanc.' },
        { timeTag: '12:30', title: 'Snorkeling et Déjeuner', description: '2 sessions de snorkeling guidées et buffet de fruits de mer.' }
      ]
    },
    pl: {
      title: 'VIP Rejs na Orange Bay Island ze Snorkelingiem i Buffetem Owoców Morza',
      cardExcerpt: 'Popłyń do egipskich Karaibów! Odpocznij na Orange Bay i snorkeluj w koralowych rafach.',
      description: 'Rejs luksusowym jachtem na Orange Bay na wyspie Giftun. Ciesz się 2 godzinami na nieskazitelnych plażach, 2 sesjami snorkelingu i buffet otwartym.',
      itinerary: [
        { timeTag: '08:00', title: 'Odbiór z hotelu', description: 'Transfer do mariny.' },
        { timeTag: '10:00', title: 'Orange Bay', description: '2 godziny na białych piaszczystych plażach.' },
        { timeTag: '12:30', title: 'Snorkeling i Lunch', description: '2 sesje snorkelingu i buffet z owocami morza.' }
      ]
    },
    es: {
      title: 'Crucero VIP a Orange Bay Island con Snorkel y Buffet de Mariscos',
      cardExcerpt: '¡Navega hacia el Caribe egipcio! Relájate en Orange Bay, haz snorkel en los arrecifes y disfruta de mariscos frescos.',
      description: 'Crucero en yate de lujo a Orange Bay en la isla Giftun. Disfruta de 2 horas en playas vírgenes, 2 paradas de snorkel, deportes acuáticos y almuerzo buffet abierto.',
      itinerary: [
        { timeTag: '08:00', title: 'Recogida en el hotel', description: 'Transfer a la marina.' },
        { timeTag: '10:00', title: 'Orange Bay', description: '2 horas en las playas de arena blanca.' },
        { timeTag: '12:30', title: 'Snorkel y Almuerzo', description: '2 sesiones de snorkel guiadas y buffet de mariscos.' }
      ]
    }
  },
  {
    slug: 'hurghada-mega-safari-quad-buggy-bedouin-dinner',
    it: {
      title: 'Mega Safari nel Deserto: Quad, Buggy, Cammello e Cena Beduina',
      cardExcerpt: 'L\'avventura definitiva nel deserto! Quad, buggy fuoristrada, giro a dorso di cammello e autentica cena beduina.',
      description: 'Un\'avventura completa nel deserto del Mar Rosso: guida un quad potente, corri con i buggy, cavalca cammelli al tramonto e concludi con una cena tradizionale beduina sotto le stelle.',
      itinerary: [
        { timeTag: '15:00', title: 'Partenza dall\'hotel', description: 'Transfer verso la base del safari nel deserto orientale.' },
        { timeTag: '15:30', title: 'Safari su Quad e Buggy', description: 'Emozionante sessione di guida quad e buggy tra le dune.' },
        { timeTag: '17:00', title: 'Giro a Dorso di Cammello', description: 'Passeggiata al tramonto a dorso di cammello.' },
        { timeTag: '18:30', title: 'Cena Beduina', description: 'Cena tradizionale e spettacolo con danzatrice del ventre.' }
      ]
    },
    fr: {
      title: 'Mega Safari dans le Désert: Quad, Buggy, Chameau et Dîner Bédouin',
      cardExcerpt: 'L\'aventure désert ultime! Quad, buggies 4x4, balade à dos de chameau et dîner bédouin authentique.',
      description: 'Une aventure complète dans le désert de la Mer Rouge: pilotez un quad, courez en buggy, montez à dos de chameau au coucher du soleil et terminez par un dîner bédouin traditionnel sous les étoiles.',
      itinerary: [
        { timeTag: '15:00', title: 'Prise en charge à l\'hôtel', description: 'Transfer vers la base du safari dans le désert de l\'Est.' },
        { timeTag: '15:30', title: 'Safari Quad et Buggy', description: 'Excitante session de conduite de quad et buggy dans les dunes.' },
        { timeTag: '17:00', title: 'Balade à Dos de Chameau', description: 'Promenade au coucher du soleil à dos de chameau.' },
        { timeTag: '18:30', title: 'Dîner Bédouin', description: 'Dîner traditionnel et spectacle de danse du ventre.' }
      ]
    },
    pl: {
      title: 'Mega Safari na Pustyni: Quad, Buggy, Wielbłąd i Kolacja Beduińska',
      cardExcerpt: 'Ekstremalny safari! Quad, buggy terenowe, przejażdżka na wielbłądzie i autentyczna kolacja beduińska.',
      description: 'Kompletna przygoda na pustyni Morza Czerwonego: quad, buggy, przejażdżka na wielbłądzie o zachodzie słońca i tradycyjna kolacja beduińska pod gwiazdami.',
      itinerary: [
        { timeTag: '15:00', title: 'Odbiór z hotelu', description: 'Transfer na bazę safari w Wschodniej Pustyni.' },
        { timeTag: '15:30', title: 'Safari Quad i Buggy', description: 'Emocjonująca jazda quadem i buggy przez wydmy.' },
        { timeTag: '17:00', title: 'Przejażdżka na Wielbłądzie', description: 'Zachód słońca na grzbiecie wielbłąda.' },
        { timeTag: '18:30', title: 'Kolacja Beduińska', description: 'Tradycyjna kolacja i taniec brzucha.' }
      ]
    },
    es: {
      title: 'Mega Safari en el Desierto: Quad, Buggy, Camello y Cena Beduina',
      cardExcerpt: '¡La aventura definitiva en el desierto! Quad, buggies 4x4, paseo en camello y auténtica cena beduina.',
      description: 'Una aventura completa en el desierto del Mar Rojo: conduce un quad, corre en buggy, cabalga en camello al atardecer y termina con una cena tradicional beduina bajo las estrellas.',
      itinerary: [
        { timeTag: '15:00', title: 'Recogida en el hotel', description: 'Transfer a la base del safari en el Desierto Oriental.' },
        { timeTag: '15:30', title: 'Safari en Quad y Buggy', description: 'Emocionante sesión de conducción de quad y buggy en las dunas.' },
        { timeTag: '17:00', title: 'Paseo en Camello', description: 'Paseo al atardecer a lomos de camello.' },
        { timeTag: '18:30', title: 'Cena Beduina', description: 'Cena tradicional y espectáculo de danza del vientre.' }
      ]
    }
  },
  {
    slug: 'ras-mohamed-white-island-luxury-yacht-sharm',
    it: {
      title: 'Ras Mohamed e White Island: Crociera VIP in Yacht con Pranzo',
      cardExcerpt: 'Crociera verso il Parco Nazionale di Ras Mohamed! Snorkeling sulle barriere coralline più famose del Sinai.',
      description: 'Esplora le acque cristalline del Parco Nazionale di Ras Mohamed su uno yacht di lusso. 3 soste snorkeling, pranzo a buffet e relax a bordo della spiaggia di White Island.',
      itinerary: [
        { timeTag: '08:30', title: 'Partenza dal porto', description: 'Imbarco allo Sharm El Sheikh Marina Port.' },
        { timeTag: '10:30', title: 'Prima Sosta Snorkeling', description: 'Immersione guidata nelle acque di Ras Mohamed.' },
        { timeTag: '12:30', title: 'Pranzo a Bordo', description: 'Buffet fresco con pesce alla griglia e insalate.' },
        { timeTag: '14:00', title: 'White Island', description: 'Relax sulla spiaggia bianca di White Island.' }
      ]
    },
    fr: {
      title: 'Ras Mohamed et White Island: Croisière VIP en Yacht avec Déjeuner',
      cardExcerpt: 'Croisière vers le Parc National de Ras Mohamed! Snorkeling dans les récifs les plus célèbres du Sinaï.',
      description: 'Explorez les eaux cristallines du Parc National de Ras Mohamed sur un yacht de luxe. 3 arrêts de snorkeling, déjeuner buffet et détente à bord.',
      itinerary: [
        { timeTag: '08:30', title: 'Départ du port', description: 'Embarquement au port de Charm el-Cheikh.' },
        { timeTag: '10:30', title: 'Premier Arrêt Snorkeling', description: 'Plongée guidée dans les eaux de Ras Mohamed.' },
        { timeTag: '12:30', title: 'Déjeuner à Bord', description: 'Buffet frais avec poisson grillé et salades.' },
        { timeTag: '14:00', title: 'White Island', description: 'Détente sur la plage blanche de White Island.' }
      ]
    },
    pl: {
      title: 'Ras Mohamed i White Island: Rejs VIP Jachtem z Lunchem',
      cardExcerpt: 'Rejs do Parku Narodowego Ras Mohamed! Snorkeling na najsłynniejszych rafach Synaju.',
      description: 'Odkryj krystaliczne wody Parku Narodowego Ras Mohamed na luksusowym jachcie. 3 postoje snorkelingowe, bufet otwarty i relaks na pokładzie.',
      itinerary: [
        { timeTag: '08:30', title: 'Wyjście z portu', description: 'Zaokrętowanie w Sharm El Sheikh Marina Port.' },
        { timeTag: '10:30', title: 'Pierwszy Postój Snorkelingowy', description: 'Prowadzone nurkowanie w wodach Ras Mohamed.' },
        { timeTag: '12:30', title: 'Lunch na Pokładzie', description: 'Bufet z grillowanymi rybami i sałatkami.' },
        { timeTag: '14:00', title: 'White Island', description: 'Relaks na białej plaży White Island.' }
      ]
    },
    es: {
      title: 'Ras Mohamed y White Island: Crucero VIP en Yate con Almuerzo',
      cardExcerpt: 'Crucero al Parque Nacional Ras Mohamed! Snorkel en los arrecifes más famosos del Sinaí.',
      description: 'Explora las aguas cristalinas del Parque Nacional Ras Mohamed en un yate de lujo. 3 paradas de snorkel, almuerzo buffet y relax a bordo.',
      itinerary: [
        { timeTag: '08:30', title: 'Salida del puerto', description: 'Embarque en el Puerto de Sharm El Sheikh.' },
        { timeTag: '10:30', title: 'Primera Parada de Snorkel', description: 'Snorkel guiado en las aguas de Ras Mohamed.' },
        { timeTag: '12:30', title: 'Almuerzo a Bordo', description: 'Buffet con pescado a la parrilla y ensaladas.' },
        { timeTag: '14:00', title: 'White Island', description: 'Relax en la playa blanca de White Island.' }
      ]
    }
  },
  {
    slug: 'mount-sinai-sunrise-st-catherine-monastery-tour',
    it: {
      title: 'Trekking Alba sul Monte Sinai e Monastero di Santa Caterina',
      cardExcerpt: 'Un\'esperienza spirituale indimenticabile: ascendi al tramonto il Monte Sinai e visita il Monastero di Santa Caterina.',
      description: 'Un\'escursione notturna al sacro Monte Sinai (2285 m). Scala il monte al buio per ammirare l\'alba dalla vetta e visita il leggendario Monastero di Santa Caterina al mattino.',
      itinerary: [
        { timeTag: '23:30', title: 'Partenza dall\'hotel', description: 'Transfer notturno verso Santa Caterina.' },
        { timeTag: '02:00', title: 'Inizio Trekking', description: 'Ascesa al Monte Sinai con guida locale.' },
        { timeTag: '05:30', title: 'Alba sulla Vetta', description: 'Spettacolare alba vista dalla cima sacra.' },
        { timeTag: '08:00', title: 'Monastero di Santa Caterina', description: 'Visita al monastero più antico del mondo cristiano.' }
      ]
    },
    fr: {
      title: 'Randonnée au Lever du Soleil sur le Mont Sinaï et Monastère Sainte-Catherine',
      cardExcerpt: 'Une expérience spirituelle inoubliable: escaladez le Mont Sinaï la nuit pour voir le lever du soleil du sommet.',
      description: 'Randonnée nocturne sur le sacré Mont Sinaï (2285 m). Montez dans l\'obscurité pour admirer le lever du soleil depuis le sommet et visitez le légendaire Monastère Sainte-Catherine.',
      itinerary: [
        { timeTag: '23:30', title: 'Départ de l\'hôtel', description: 'Transfer nocturne vers Sainte-Catherine.' },
        { timeTag: '02:00', title: 'Début de la Randonnée', description: 'Ascension du Mont Sinaï avec guide local.' },
        { timeTag: '05:30', title: 'Lever du Soleil au Sommet', description: 'Spectaculaire lever du soleil depuis le sommet sacré.' },
        { timeTag: '08:00', title: 'Monastère Sainte-Catherine', description: 'Visite du plus ancien monastère du monde chrétien.' }
      ]
    },
    pl: {
      title: 'Trekking o Świcie na Górę Synaj i Klasztor św. Katarzyny',
      cardExcerpt: 'Niezapomniane doświadczenie duchowe: nocny trekking na Górę Synaj i wschód słońca ze szczytu.',
      description: 'Nocna wędrówka na świętą Górę Synaj (2285 m). Wspinaj się w ciemności, by podziwiać wschód słońca ze szczytu i zwiedzić legendarny Klasztor św. Katarzyny.',
      itinerary: [
        { timeTag: '23:30', title: 'Wyjazd z hotelu', description: 'Nocny transfer do Świętej Katarzyny.' },
        { timeTag: '02:00', title: 'Początek Trekkingu', description: 'Wspinaczka na Górę Synaj z lokalnym przewodnikiem.' },
        { timeTag: '05:30', title: 'Wschód Słońca na Szczycie', description: 'Spektakularny wschód słońca z świętego szczytu.' },
        { timeTag: '08:00', title: 'Klasztor św. Katarzyny', description: 'Wizyta w najstarszym klasztorze świata chrześcijańskiego.' }
      ]
    },
    es: {
      title: 'Trekking al Amanecer en el Monte Sinaí y Monasterio de Santa Catalina',
      cardExcerpt: 'Una experiencia espiritual inolvidable: sube al Monte Sinaí de noche para ver el amanecer desde la cima.',
      description: 'Trekking nocturno al sagrado Monte Sinaí (2285 m). Sube en la oscuridad para admirar el amanecer desde la cima y visita el legendario Monasterio de Santa Catalina.',
      itinerary: [
        { timeTag: '23:30', title: 'Salida del hotel', description: 'Transfer nocturno hacia Santa Catalina.' },
        { timeTag: '02:00', title: 'Inicio del Trekking', description: 'Ascenso al Monte Sinaí con guía local.' },
        { timeTag: '05:30', title: 'Amanecer en la Cima', description: 'Espectacular amanecer desde la cima sagrada.' },
        { timeTag: '08:00', title: 'Monasterio de Santa Catalina', description: 'Visita al monasterio más antiguo del mundo cristiano.' }
      ]
    }
  },
  {
    slug: 'sataya-dolphin-reef-marsa-alam-luxury-cruise',
    it: {
      title: 'Reef Sataya Marsa Alam: Nuoto con Delfini Selvatici e Pranzo',
      cardExcerpt: 'Il santuario dei delfini n.1 in Egitto! Nuota con grandi branchi di delfini filatori nelle acque turchesi vergini.',
      description: 'Veleggia verso il famoso Reef Sataya nel Mar Rosso meridionale. Casa di centinaia di delfini filatori giocosi, farai snorkeling in lagune cristalline e godrai di pranzo a buffet aperto.',
      itinerary: [
        { timeTag: '06:30', title: 'Partenza dall\'hotel', description: 'Transfer verso il porto di Hamata.' },
        { timeTag: '10:30', title: 'Nuoto con i Delfini', description: 'Snorkeling direttamente con i delfini filatori selvatici.' },
        { timeTag: '13:00', title: 'Pranzo e Seconda Sosta', description: 'Buffet a bordo e snorkeling sulle barriere coralline.' }
      ]
    },
    fr: {
      title: 'Récif Sataya Marsa Alam: Nage avec les Dauphins Sauvages et Déjeuner',
      cardExcerpt: 'Le sanctuaire de dauphins n°1 en Égypte! Nagez avec des bancs entiers de dauphins fileurs dans des eaux turquoise vierges.',
      description: 'Voguez vers le célèbre Récif Sataya en Mer Rouge sud. Maison de centaines de dauphins fileurs joueurs, faites du snorkeling dans des lagons cristallins et profitez d\'un buffet ouvert.',
      itinerary: [
        { timeTag: '06:30', title: 'Prise en charge à l\'hôtel', description: 'Transfer vers le port de Hamata.' },
        { timeTag: '10:30', title: 'Nage avec les Dauphins', description: 'Snorkeling directement avec les dauphins fileurs sauvages.' },
        { timeTag: '13:00', title: 'Déjeuner et Deuxième Arrêt', description: 'Buffet à bord et snorkeling sur les récifs coralliens.' }
      ]
    },
    pl: {
      title: 'Rafa Sataya Marsa Alam: Pływanie z Dzikimi Delfinami i Lunch',
      cardExcerpt: 'Najlepsze sanktuarium delfinów w Egipcie! Pływaj z ogromnymi ławicami dzikich delfinów wrzecionowatych w dziewiczych turkusowych wodach.',
      description: 'Popłyń do słynnej Rafy Sataya na południowym Morzu Czerwonym. Dom setek figlarnych delfinów, snorkeling w krystalicznych lagunach i otwarty bufet.',
      itinerary: [
        { timeTag: '06:30', title: 'Odbiór z hotelu', description: 'Transfer do portu Hamata.' },
        { timeTag: '10:30', title: 'Pływanie z Delfinami', description: 'Snorkeling bezpośrednio z dzikimi delfinami wrzecionowatymi.' },
        { timeTag: '13:00', title: 'Lunch i Drugi Postój', description: 'Bufet na pokładzie i snorkeling na rafach koralowych.' }
      ]
    },
    es: {
      title: 'Arrecife Sataya Marsa Alam: Natación con Delfines Salvajes y Almuerzo',
      cardExcerpt: 'El santuario de delfines n.°1 en Egipto! Nada con enormes bancos de delfines giradores salvajes en aguas turquesas vírgenes.',
      description: 'Navega hacia el famoso Arrecife Sataya en el Mar Rojo sur. Hogar de cientos de juguetones delfines giradores, harás snorkel en lagunas cristalinas y disfrutarás de buffet abierto.',
      itinerary: [
        { timeTag: '06:30', title: 'Recogida en el hotel', description: 'Transfer al puerto de Hamata.' },
        { timeTag: '10:30', title: 'Natación con Delfines', description: 'Snorkel directamente con delfines giradores salvajes.' },
        { timeTag: '13:00', title: 'Almuerzo y Segunda Parada', description: 'Buffet a bordo y snorkel en los arrecifes de coral.' }
      ]
    }
  },
  {
    slug: 'abu-dabbab-sea-turtle-dugong-bay-snorkeling',
    it: {
      title: 'Baia di Abu Dabbab Snorkeling: Tartarughe Marine Giganti e Dugonghi',
      cardExcerpt: 'Nuota con le tartarughe marine verdi giganti e il leggendario dugongo nella baia di Abu Dabbab.',
      description: 'Trascorri una giornata indimenticabile nella baia di Abu Dabbab, uno dei pochi posti sulla Terra dove le tartarughe verdi giganti e i rari dugonghi prosperano nelle acque turchesi poco profonde.',
      itinerary: [
        { timeTag: '08:30', title: 'Partenza dall\'hotel', description: 'Transfer alla Baia di Abu Dabbab.' },
        { timeTag: '09:30', title: 'Snorkeling con le Tartarughe', description: 'Snorkeling guidato sui fondali erbosi per osservare le tartarughe giganti.' },
        { timeTag: '12:30', title: 'Pranzo in Riva al Mare', description: 'Ottimo pranzo al ristorante sulla spiaggia.' },
        { timeTag: '14:30', title: 'Trasferimento di Ritorno', description: 'Ritorno in hotel.' }
      ]
    },
    fr: {
      title: 'Baie d\'Abu Dabbab Snorkeling: Tortues Marines Géantes et Dugongs',
      cardExcerpt: 'Nagez avec les tortues vertes géantes et le légendaire dugong (vache de mer) à la plage d\'Abu Dabbab.',
      description: 'Passez une journée inoubliable à la Baie d\'Abu Dabbab, l\'un des rares endroits sur Terre où les tortues vertes géantes et les dugongs rares prospèrent dans les eaux turquoise peu profondes.',
      itinerary: [
        { timeTag: '08:30', title: 'Prise en charge à l\'hôtel', description: 'Transfer à la Baie d\'Abu Dabbab.' },
        { timeTag: '09:30', title: 'Snorkeling avec les Tortues', description: 'Plongée guidée sur les herbiers pour observer les tortues géantes.' },
        { timeTag: '12:30', title: 'Déjeuner en Bord de Mer', description: 'Excellent déjeuner au restaurant sur la plage.' },
        { timeTag: '14:30', title: 'Transfer Retour', description: 'Retour à l\'hôtel.' }
      ]
    },
    pl: {
      title: 'Zatoka Abu Dabbab Snorkeling: Gigantyczne Żółwie Morskie i Dugongi',
      cardExcerpt: 'Pływaj z gigantycznymi zielonymi żółwiami morskimi i legendarnym dugonem na plaży Abu Dabbab.',
      description: 'Spędź niezapomnianą wycieczkę w zatoce Abu Dabbab, jednym z niewielu miejsc na Ziemi, gdzie gigantyczne zielone żółwie i rzadkie dugongi żyją w płytkich turkusowych wodach.',
      itinerary: [
        { timeTag: '08:30', title: 'Odbiór z hotelu', description: 'Transfer do Zatoki Abu Dabbab.' },
        { timeTag: '09:30', title: 'Snorkeling z Żółwiami', description: 'Prowadzone nurkowanie na łąkach trawy morskiej w celu obserwacji gigantycznych żółwi.' },
        { timeTag: '12:30', title: 'Lunch przy Plaży', description: 'Doskonały lunch w restauracji na plaży.' },
        { timeTag: '14:30', title: 'Transfer Powrotny', description: 'Powrót do hotelu.' }
      ]
    },
    es: {
      title: 'Bahía Abu Dabbab Snorkel: Tortugas Marinas Gigantes y Dugongos',
      cardExcerpt: 'Nada con tortugas verdes gigantes y el legendario dugongo (vaca marina) en la playa de Abu Dabbab.',
      description: 'Pasa un día inolvidable en la Bahía Abu Dabbab, uno de los pocos lugares en la Tierra donde las tortugas verdes gigantes y los raros dugongos prosperan en aguas turquesas poco profundas.',
      itinerary: [
        { timeTag: '08:30', title: 'Recogida en el hotel', description: 'Transfer a la Bahía Abu Dabbab.' },
        { timeTag: '09:30', title: 'Snorkel con Tortugas', description: 'Snorkel guiado en los praderas de posidonia para observar tortugas gigantes.' },
        { timeTag: '12:30', title: 'Almuerzo a Orillas del Mar', description: 'Excelente almuerzo en el restaurante de playa.' },
        { timeTag: '14:30', title: 'Transfer de Regreso', description: 'Regreso al hotel.' }
      ]
    }
  }
];

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Patching missing it/fr/pl/es translations');
  console.log(`  Tours to patch: ${PATCHES.length}`);
  console.log('═══════════════════════════════════════════════\n');

  let ok = 0;
  let failed = 0;

  for (const patch of PATCHES) {
    const { slug, ...langPatches } = patch;

    const existing = await prisma.tour.findUnique({
      where: { slug },
      select: { translations: true }
    });

    if (!existing) {
      console.log(`  ✗ Tour not found: ${slug}`);
      failed++;
      continue;
    }

    const current = existing.translations || {};
    const updated = { ...current };

    for (const [lang, content] of Object.entries(langPatches)) {
      updated[lang] = content;
    }

    await prisma.tour.update({
      where: { slug },
      data: { translations: updated }
    });

    const langs = Object.keys(langPatches).join(', ');
    console.log(`  ✓ Patched [${langs}]: ${slug}`);
    ok++;
  }

  console.log(`\n✅ Done: ${ok} tours patched, ${failed} failed`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
