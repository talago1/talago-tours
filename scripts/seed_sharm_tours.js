const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Step 1: Updating Destination El Gouna -> Sharm El Sheikh ---');

  // Find destination by slug el-gouna or name El Gouna
  let dest = await prisma.destination.findFirst({
    where: {
      OR: [
        { slug: 'el-gouna' },
        { name: { contains: 'Gouna', mode: 'insensitive' } },
        { slug: 'sharm-el-sheikh' },
      ],
    },
  });

  const sharmData = {
    name: 'Sharm El Sheikh',
    slug: 'sharm-el-sheikh',
    imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    description: 'Sinai’s premier coastal paradise, celebrated worldwide for crystal-clear Red Sea waters, Ras Mohamed’s vibrant coral reefs, mystical desert mountains, and biblical landmarks.',
    translations: {
      en: {
        name: 'Sharm El Sheikh',
        description: 'Sinai’s premier coastal paradise, celebrated worldwide for crystal-clear Red Sea waters, Ras Mohamed’s vibrant coral reefs, mystical desert mountains, and biblical landmarks.',
      },
      ar: {
        name: 'شرم الشيخ',
        description: 'مدينة السلام وجوهرة سيناء، تشتهر بمياهها الفيروزية الساحرة، وشعاب رأس محمد المرجانية المصنفة عالمياً، ورحلات السفاري الصحراوية وجبل موسى.',
      },
      de: {
        name: 'Scharm El-Scheich',
        description: 'Sinais führendes Küstenparadies, weltberühmt für kristallklares Wasser, die lebendigen Korallenriffe von Ras Mohamed und mystische Wüstenberge.',
      },
      ru: {
        name: 'Шарм-эль-Шейх',
        description: 'Главный прибрежный курорт Синая, известный кристальными водами Красного моря, коралловыми рифами Рас-Мохаммед и сафари.',
      },
      it: {
        name: 'Sharm El Sheikh',
        description: 'La perla del Sinai, rinomata per le acque cristalline del Mar Rosso, le barriere coralline di Ras Mohamed e i suggestivi safari nel deserto.',
      },
      fr: {
        name: 'Charm el-Cheikh',
        description: 'La station balnéaire phare du Sinaï, célèbre pour ses eaux cristallines, les récifs coralliens de Ras Mohamed et ses paysages désertiques.',
      },
      pl: {
        name: 'Szarm el-Szejk',
        description: 'Najważniejszy kurort Synaju, znany z krystalicznie czystych wód Morza Czerwonego, raf koralowych Ras Mohamed i pustynnych safari.',
      },
      es: {
        name: 'Sharm El Sheikh',
        description: 'El paraíso costero del Sinaí, famoso por las aguas cristalinas del Mar Rojo, los arrecifes de Ras Mohamed y safaris en el desierto.',
      },
    },
  };

  if (dest) {
    dest = await prisma.destination.update({
      where: { id: dest.id },
      data: sharmData,
    });
    console.log('Updated existing destination to Sharm El Sheikh:', dest.id);
  } else {
    dest = await prisma.destination.create({
      data: sharmData,
    });
    console.log('Created new Sharm El Sheikh destination:', dest.id);
  }

  console.log('--- Step 2: Creating / Ensuring Sharm El Sheikh Zones ---');
  const zoneConfigs = [
    { name: 'Naama Bay', transferFee: 0, pickupOffset: 0 },
    { name: 'Nabq Bay', transferFee: 5, pickupOffset: 20 },
    { name: 'Ras Um Sid / Hadaba', transferFee: 0, pickupOffset: 10 },
    { name: 'Sharks Bay', transferFee: 0, pickupOffset: 15 },
    { name: 'Dahab Area', transferFee: 25, pickupOffset: 60 },
  ];

  const zones = {};
  for (const z of zoneConfigs) {
    const existing = await prisma.zone.findUnique({ where: { name: z.name } });
    if (existing) {
      zones[z.name] = await prisma.zone.update({
        where: { id: existing.id },
        data: { destinationId: dest.id, transferFee: z.transferFee, pickupOffset: z.pickupOffset },
      });
    } else {
      zones[z.name] = await prisma.zone.create({
        data: { name: z.name, destinationId: dest.id, transferFee: z.transferFee, pickupOffset: z.pickupOffset },
      });
    }
  }
  console.log('Zones ready:', Object.keys(zones));

  const primaryZoneId = zones['Naama Bay'].id;

  console.log('--- Step 3: Seeding 9 Sharm El Sheikh Tours ---');

  const toursToSeed = [
    {
      slug: 'ras-mohamed-white-island-luxury-cruise',
      type: 'SHARED',
      category: 'Sea',
      status: 'ACTIVE',
      basePriceUSD: 38,
      basePrice: 38,
      adultPrice: 38,
      originalPrice: 55,
      childPrice: 19,
      durationHours: 8,
      duration: '8 Hours',
      maxCapacity: 35,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.9,
      ratingCount: 128,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
        'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80',
      ],
      highlights: [
        'Cruise to Ras Mohamed National Park & the famous White Island',
        'Walk on the pristine sandbanks dubbed "The Egyptian Maldives"',
        'Two guided snorkeling stops at vibrant world-class coral reefs',
        'Freshly cooked open buffet seafood & barbecue lunch onboard',
        'Unlimited soft drinks, coffee, tea, and mineral water all day',
      ],
      inclusions: [
        'Round-trip hotel pickup and drop-off in air-conditioned bus',
        'VIP luxury yacht cruise with sun deck and shaded seating',
        'Freshly cooked open buffet lunch with seafood & BBQ',
        'Unlimited hot and cold beverages all day',
        'Professional snorkeling guide and national park entry',
      ],
      exclusions: [
        'Snorkeling gear rental (mask/fins approx $5-7 if needed)',
        'Underwater photography package',
        'Personal gratuities',
      ],
      translations: {
        en: {
          title: 'Ras Mohamed & White Island Luxury Yacht Cruise',
          description: 'Sail aboard a luxury yacht to Ras Mohamed National Park and the magical White Island sandbank. Enjoy two world-class snorkeling stops with vibrant marine life, followed by a sumptuous barbecue and seafood lunch buffet with unlimited beverages.',
        },
        ar: {
          title: 'رحلة يخت رأس محمد والجزيرة البيضاء (مالديف مصر)',
          description: 'رحلة بحرية فاخرة باليخت إلى محمية رأس محمد والجزيرة البيضاء ذات الرمال الناعمة وسط مياه البحر الفيروزية. تشمل وقفتين سنوركلينج وبوفيه غداء مأكولات بحرية ومشويات مع مشروبات طوال اليوم.',
        },
        de: {
          title: 'Luxus-Yachtfahrt nach Ras Mohamed & White Island',
          description: 'Segeln Sie mit einer Luxusyacht zum Nationalpark Ras Mohamed und zur traumhaften Sandbank White Island. Erleben Sie Schnorchelstopps an weltberühmten Riffen und ein reichhaltiges Meeresfrüchte- und BBQ-Buffet.',
        },
        ru: {
          title: 'Морская прогулка в Рас Мохаммед и Белый Остров на яхте',
          description: 'Роскошный круиз на яхте в национальный парк Рас Мохаммед и на знаменитый Белый остров. Две остановки для снорклинга на ярких рифах, вкусный обед с морепродуктами и барбекю, неограниченные напитки.',
        },
        it: {
          title: 'Crociera in Yacht a Ras Mohamed e White Island',
          description: 'Naviga su uno yacht di lusso verso il Parco Nazionale di Ras Mohamed e la spettacolare lingua di sabbia di White Island. Due tappe di snorkeling tra i coralli e pranzo a buffet a base di pesce e grigliata.',
        },
        fr: {
          title: 'Croisière de Luxe en Yacht à Ras Mohamed & White Island',
          description: 'Embarquez sur un yacht de luxe vers le parc national de Ras Mohamed et le banc de sable de White Island. Deux arrêts snorkeling exceptionnels et déjeuner buffet barbecue et fruits de mer.',
        },
        pl: {
          title: 'Luksusowy Rejs Jachtem do Ras Mohamed i White Island',
          description: 'Rejs luksusowym jachtem do Parku Narodowego Ras Mohamed i na piaszczystą Białą Wyspę. Dwa postoje na snurkowanie przy rafach koralowych oraz wykwintny obiad w formie bufetu.',
        },
        es: {
          title: 'Crucero en Yate de Lujo a Ras Mohamed e Isla Blanca',
          description: 'Navega en un yate de lujo al Parque Nacional de Ras Mohamed y a la mágica Isla Blanca. Disfruta de paradas para practicar snorkel y un delicioso almuerzo buffet con mariscos y barbacoa.',
        },
      },
    },

    {
      slug: 'ras-mohamed-national-park-bus-tour',
      type: 'SHARED',
      category: 'Sea',
      status: 'ACTIVE',
      basePriceUSD: 24,
      basePrice: 24,
      adultPrice: 24,
      originalPrice: 35,
      childPrice: 12,
      durationHours: 5,
      duration: '5 Hours (Half Day)',
      maxCapacity: 30,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.8,
      ratingCount: 94,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
      ],
      highlights: [
        'Pass through the monumental stone "Gate of Allah"',
        'Witness ancient mangrove trees thriving in saltwater',
        'Visit the dramatic geological earthquake crack',
        'Swim in the enchanting Magic Lake (wish-making lake)',
        'Beach snorkeling at the magnificent Yolanda and Shark reefs',
      ],
      inclusions: [
        'Round-trip hotel transfers in air-conditioned bus',
        'All Ras Mohamed National Park admission fees',
        'Licensed professional tour guide throughout',
        'Stops at Gate of Allah, Mangroves, Earthquake crack, Magic Lake',
      ],
      exclusions: [
        'Snorkeling gear rental',
        'Personal drinks and snacks',
        'Gratuities',
      ],
      translations: {
        en: {
          title: 'Ras Mohamed National Park Half-Day Bus Trip',
          description: 'Explore the terrestrial and marine wonders of Ras Mohamed by comfortable air-conditioned coach. Marvel at the giant Gate of Allah, ancient mangrove forests, earthquake fissure, swim in the Magic Lake, and snorkel from the beach.',
        },
        ar: {
          title: 'رحلة محمية رأس محمد بالأتوبيس (نصف يوم)',
          description: 'جولة برية ممتعة بالأتوبيس المكيف لاكتشاف معالم محمية رأس محمد: بوابة الله الحجرية، غابات المانجروف الفريدة، شق الزلزال، والسباحة في البحيرة المسحورة مع فرصة سنوركلينج ساحرة من الشاطئ.',
        },
        de: {
          title: 'Halbtagesausflug mit dem Bus zum Nationalpark Ras Mohamed',
          description: 'Erkunden Sie Ras Mohamed bequem per klimatisiertem Bus. Besuchen Sie das gigantische Tor Gottes, die Mangrovenwälder, den Erdbebenspalt und den Magischen See mit Schnorcheln am Strand.',
        },
        ru: {
          title: 'Экскурсия в заповедник Рас Мохаммед на автобусе (полдня)',
          description: 'Увлекательная поездка на автобусе в заповедник Рас Мохаммед: Ворота Аллаха, мангровые рощи, тектонический разлом, купание в Магическом озере и снорклинг с берега.',
        },
        it: {
          title: 'Escursione in Bus a Ras Mohamed (Mezza Giornata)',
          description: 'Scopri le meraviglie del Parco Nazionale di Ras Mohamed in autobus: la maestosa Porta di Allah, le mangrovie, la spaccatura del terremoto, il Lago Magico e snorkeling dalla spiaggia.',
        },
        fr: {
          title: 'Excursion en Bus au Parc National de Ras Mohamed',
          description: 'Visitez Ras Mohamed en bus climatisé : franchissez la Porte d’Allah, découvrez la mangrove, la faille du séisme, baignez-vous dans le Lac Magique et faites du snorkeling depuis la plage.',
        },
        pl: {
          title: 'Wycieczka Autobusowa do Parku Narodowego Ras Mohamed',
          description: 'Odkryj lądowe i morskie skarby Ras Mohamed: Kamienną Bramę Allaha, lasy namorzynowe, szczelinę trzęsienia ziemi, Magiczne Jezioro oraz snurkowanie z plaży.',
        },
        es: {
          title: 'Excursión en Autobús al Parque Nacional Ras Mohamed',
          description: 'Descubre los tesoros de Ras Mohamed en autobús: la Puerta de Alá, el bosque de manglares, la grieta del terremoto, el Lago Mágico y snorkel desde la orilla.',
        },
      },
    },

    {
      slug: 'cairo-pyramids-day-trip-from-sharm',
      type: 'SHARED',
      category: 'Cultural',
      status: 'ACTIVE',
      basePriceUSD: 55,
      basePrice: 55,
      adultPrice: 55,
      originalPrice: 75,
      childPrice: 35,
      durationHours: 20,
      duration: 'Full Day (20h)',
      maxCapacity: 40,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.7,
      ratingCount: 165,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
        'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&q=80',
        'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80',
      ],
      highlights: [
        'Stand in awe before the Great Pyramids of Giza (Khufu, Khafre, Menkaure)',
        'Up-close encounter with the legendary Great Sphinx and Valley Temple',
        'Guided tour inside the historic Egyptian Museum in Tahrir Square',
        'Delicious hot oriental lunch buffet at a quality Cairo restaurant',
        'Accompanied by a certified professional Egyptologist guide',
      ],
      inclusions: [
        'Round-trip hotel transfers in modern air-conditioned tourism coach',
        'Official entrance tickets to the Giza Pyramids plateau & Sphinx',
        'Official entrance tickets to the Egyptian Museum in Tahrir',
        'Delicious restaurant lunch in Cairo',
        'Certified English/multilingual Egyptologist guide',
      ],
      exclusions: [
        'Beverages during lunch',
        'Entrance tickets inside the Great Pyramid burial chamber',
        'Optional felucca sailboat ride on the Nile River',
      ],
      translations: {
        en: {
          title: 'Cairo & Pyramids of Giza Day Trip from Sharm El Sheikh',
          description: 'Experience the wonder of ancient Egypt with a comprehensive day trip to Cairo by air-conditioned coach. Stand before the Great Pyramids of Giza, gaze at the Sphinx, explore treasures at the Egyptian Museum, and enjoy a local lunch.',
        },
        ar: {
          title: 'رحلة القاهرة والأهرامات من شرم الشيخ بالأتوبيس',
          description: 'رحلة يوم كامل لا تنسى من شرم الشيخ إلى القاهرة لزيارة أهرامات الجيزة الخالدة وتمثال أبو الهول ومعبد الوادي، واستكشاف كنوز المتحف المصري بميدان التحرير مع وجبة غداء شهية برفقة مرشد سياحي متخصص.',
        },
        de: {
          title: 'Kairo & Pyramiden von Gizeh Tagesausflug ab Scharm El-Scheich',
          description: 'Erleben Sie die Wunder des alten Ägypten bei einem Tagesausflug nach Kairo. Bestaunen Sie die Pyramiden von Gizeh, die Sphinx und das weltberühmte Ägyptische Museum inklusive Mittagessen.',
        },
        ru: {
          title: 'Экскурсия в Каир и Пирамиды из Шарм-эль-Шейха на автобусе',
          description: 'Полнодневная экскурсия в Каир из Шарм-эль-Шейха: великие пирамиды Гизы, Сфинкс, Египетский музей на площади Тахрир, обед в ресторане и сопровождение профессионального гида-египтолога.',
        },
        it: {
          title: 'Escursione al Cairo e Piramidi da Sharm El Sheikh in Bus',
          description: 'Viaggio di un giorno al Cairo per ammirare le Piramidi di Giza, la Sfinge e i capolavori del Museo Egizio con pranzo tipico e guida egittologa qualificata.',
        },
        fr: {
          title: 'Excursion au Caire et aux Pyramides depuis Charm el-Cheikh',
          description: 'Découvrez les trésors de l’Égypte antique lors d’une journée au Caire : Pyramides de Gizeh, Sphinx majestueux, Musée égyptien de la place Tahrir et déjeuner traditionnel.',
        },
        pl: {
          title: 'Wycieczka do Kairu i Piramid z Szarm el-Szejk Autokarem',
          description: 'Całodniowa wycieczka do Kairu: Piramidy w Gizie, Sfinks, Muzeum Egipskie na placu Tahrir, obiad w restauracji oraz opieka licencjonowanego egiptologa.',
        },
        es: {
          title: 'Excursión a El Cairo y Pirámides desde Sharm El Sheikh en Autobús',
          description: 'Descubre las Pirámides de Guiza, la mítica Esfinge y las joyas del Museo Egipcio de Tahrir en un viaje inolvidable de día completo con almuerzo incluido.',
        },
      },
    },

    {
      slug: 'cairo-grand-egyptian-museum-from-sharm',
      type: 'SHARED',
      category: 'Cultural',
      status: 'ACTIVE',
      basePriceUSD: 78,
      basePrice: 78,
      adultPrice: 78,
      originalPrice: 110,
      childPrice: 45,
      durationHours: 20,
      duration: 'Full Day (20h)',
      maxCapacity: 40,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 5.0,
      ratingCount: 88,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&q=80',
        'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
        'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80',
      ],
      highlights: [
        'Tour the state-of-the-art Grand Egyptian Museum (GEM) — the world\'s largest archaeological museum',
        'Marvel at the colossal Ramses II statue and the Grand Staircase',
        'Admire King Tutankhamun\'s complete golden treasures exhibited together',
        'Explore the Great Pyramids of Giza plateau and the Great Sphinx',
        'Enjoy a panoramic lunch overlooking the pyramids',
      ],
      inclusions: [
        'Round-trip air-conditioned tourism coach from Sharm hotels',
        'Full admission ticket to the Grand Egyptian Museum (GEM)',
        'Giza Pyramids and Sphinx plateau admission ticket',
        'Premium restaurant lunch with pyramid views',
        'Expert licensed Egyptologist guide throughout',
      ],
      exclusions: [
        'Drinks during lunch',
        'Entry tickets inside the Great Pyramid interior',
        'Personal souvenirs',
      ],
      translations: {
        en: {
          title: 'Cairo & Grand Egyptian Museum (GEM) Day Trip from Sharm',
          description: 'Be among the first to witness the awe-inspiring Grand Egyptian Museum (GEM), housing the complete Tutankhamun collection, paired with the iconic Pyramids of Giza and the Sphinx with an expert Egyptologist.',
        },
        ar: {
          title: 'رحلة القاهرة والمتحف المصري الكبير (GEM) من شرم الشيخ',
          description: 'كن من الأوائل الذين يزورون المتحف المصري الكبير (GEM) الأضخم في العالم لرؤية كنوز توت عنخ آمون الكاملة والدرج العظيم، بجانب جولة أهرامات الجيزة وتمثال أبو الهول وغداء بانورامي مميز.',
        },
        de: {
          title: 'Kairo & Großes Ägyptisches Museum (GEM) ab Scharm El-Scheich',
          description: 'Besuchen Sie das monumentale Große Ägyptische Museum (GEM) mit der vollständigen Tutanchamun-Sammlung und die weltberühmten Pyramiden von Gizeh und die Sphinx.',
        },
        ru: {
          title: 'Каир и Большой Египетский Музей (GEM) из Шарм-эль-Шейха',
          description: 'Эксклюзивная поездка в новый Большой Египетский Музей (GEM) — крупнейший музей древностей в мире с коллекцией Тутанхамона, и к Пирамидам Гизы со Сфинксом.',
        },
        it: {
          title: 'Il Cairo e Grande Museo Egizio (GEM) da Sharm El Sheikh',
          description: 'Scopri il nuovissimo Grande Museo Egizio (GEM) con l\'intero tesoro di Tutankhamon e ammira le imponenti Piramidi di Giza e la Sfinge.',
        },
        fr: {
          title: 'Le Caire et Grand Musée Égyptien (GEM) depuis Charm el-Cheikh',
          description: 'Visitez le spectaculaire Grand Musée Égyptien (GEM) et sa collection intégrale de Toutânkhamon, ainsi que le plateau des Pyramides de Gizeh et le Sphinx.',
        },
        pl: {
          title: 'Kair i Wielkie Muzeum Egipskie (GEM) z Szarm el-Szejk',
          description: 'Ekskluzywna wycieczka do nowo otwartego Wielkiego Muzeum Egipskiego (GEM) ze skarbami Tutanchamona oraz do piramid w Gizie i Sfinksa.',
        },
        es: {
          title: 'El Cairo y Gran Museo Egipcio (GEM) desde Sharm El Sheikh',
          description: 'Visita el impresionante Gran Museo Egipcio (GEM) con los tesoros de Tutankamón junto a las colosales Pirámides de Guiza y la Esfinge.',
        },
      },
    },

    {
      slug: 'desert-quad-bike-safari-sharm',
      type: 'SHARED',
      category: 'Safari',
      status: 'ACTIVE',
      basePriceUSD: 22,
      basePrice: 22,
      adultPrice: 22,
      originalPrice: 35,
      childPrice: 15,
      durationHours: 3,
      duration: '3 Hours',
      maxCapacity: 50,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.9,
      ratingCount: 210,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
        'https://images.unsplash.com/photo-1588412079929-791b9f8ecf0d?w=1200&q=80',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
      ],
      highlights: [
        'High-octane ATV quad biking through rugged Sinai desert valleys',
        'Test the natural acoustics at the famous Echo Caves stop',
        'Relax inside an authentic Bedouin tent with traditional herbal tea',
        'Available during sunrise, afternoon, or magical sunset times',
        'Safety briefing and trial ride suitable for beginners and pros',
      ],
      inclusions: [
        'Round-trip hotel transfers from all Sharm El Sheikh hotels',
        'Fully automatic 250cc ATV quad bike per person (or double)',
        'Professional desert safari convoy leader and safety guide',
        'Traditional Bedouin herbal habak tea in desert tent',
      ],
      exclusions: [
        'Bedouin scarf (Arafat scarf approx $2-3)',
        'Protective dust sunglasses rental',
        'Photo/video memory CD',
      ],
      translations: {
        en: {
          title: 'Sinai Desert Quad Bike (ATV) Safari with Bedouin Tea',
          description: 'Feel the adrenaline as you ride your personal quad bike across the golden dunes and mountain valleys of the Sinai desert. Stop at the Echo Valley and sip traditional herbal tea in a Bedouin tent.',
        },
        ar: {
          title: 'سفاري بيتش باجي (كواد ATV) في صحراء سيناء مع الشاي البدوي',
          description: 'عش متعة المغامرة وقيادة البيتش باجي وسط جبال ووديان صحراء سيناء الذهبية، مع وقفة في وادي الصدى والاستمتاع بالشاي البدوي بالحبق داخل الخيمة البدوية الأصيلة.',
        },
        de: {
          title: 'Quad-Safari in der Sinai-Wüste mit Beduinentee',
          description: 'Spüren Sie das Adrenalin bei einer Quad-Fahrt durch die goldenen Dünen und Berge der Sinai-Wüste. Mit Halt im Echo-Tal und traditionellem Beduinentee.',
        },
        ru: {
          title: 'Мотосафари на квадроциклах по Синайской пустыне с чаем',
          description: 'Захватывающее катание на квадроциклах по песчаным дюнам и горным долинам Синая. Остановка в Долине Эха и ароматный бедуинский чай в шатре.',
        },
        it: {
          title: 'Safari in Quad nel Deserto del Sinai con Tè Beduino',
          description: 'Sfreccia a bordo del tuo quad tra le dune dorate e le montagne del Sinai. Sosta alla Valle dell’Eco e assaggio del tradizionale tè alle erbe beduino.',
        },
        fr: {
          title: 'Safari en Quad dans le Désert du Sinaï avec Thé Bédouin',
          description: 'Vivez des sensations fortes au guidon de votre quad à travers les dunes et vallées du Sinaï. Arrêt à la Vallée de l’Écho et dégustation de thé bédouin.',
        },
        pl: {
          title: 'Safari na Quadach po Pustyni Synaj z Herbatą Beduinów',
          description: 'Poczuj dreszcz emocji podczas jazdy quadem po złotych wydmach i dolinach Synaju. Przystanek w Dolinie Echa i tradycyjna herbata w namiocie beduińskim.',
        },
        es: {
          title: 'Safari en Quad (ATV) por el Desierto del Sinaí con Té Beduino',
          description: 'Siente la adrenalina conduciendo un quad por las dunas doradas del Sinaí. Parada en el Valle del Eco y té tradicional en una jaima beduina.',
        },
      },
    },

    {
      slug: 'super-safari-sharm-el-sheikh',
      type: 'SHARED',
      category: 'Safari',
      status: 'ACTIVE',
      basePriceUSD: 38,
      basePrice: 38,
      adultPrice: 38,
      originalPrice: 55,
      childPrice: 20,
      durationHours: 6,
      duration: '6 Hours (Evening)',
      maxCapacity: 45,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.9,
      ratingCount: 178,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1588412079929-791b9f8ecf0d?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1588412079929-791b9f8ecf0d?w=1200&q=80',
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
      ],
      highlights: [
        'ATV quad bike desert ride to a scenic mountain panorama',
        'Classic camel trek across desert dunes in traditional Bedouin style',
        'Open-air Bedouin barbecue dinner buffet under the Sinai sky',
        'Oriental folklore dinner show: Tanoura spinning, Belly dance & Fire show',
        'Stargazing through powerful digital astronomical telescopes with an astronomer',
      ],
      inclusions: [
        'Round-trip hotel transfers in air-conditioned vehicles',
        'Quad bike ride across desert mountains',
        'Camel ride across the sands',
        'Bedouin open buffet BBQ dinner and soft drinks',
        'Live folklore entertainment performance (Tanoura, fire, dance)',
        'Guided digital telescope stargazing session with commentary',
      ],
      exclusions: [
        'Shisha / water pipe in tent',
        'Souvenirs and photography services',
      ],
      translations: {
        en: {
          title: 'Super Safari Sharm El Sheikh: Quad, Camel, BBQ Dinner Show & Stargazing',
          description: 'The ultimate desert night: ride ATV quads, trek by camel, savor a delicious Bedouin BBQ dinner, watch a mesmerizing oriental fire and dance show, and observe constellations through powerful telescopes.',
        },
        ar: {
          title: 'سوبر سفاري شرم الشيخ: كواد، جمال، عشاء بدوي، حفلة ورصد نجوم',
          description: 'أقوى سهرة صحراوية متكاملة في شرم الشيخ: قيادة البيتش باجي وركوب الجمال، عشاء بدوي مشويات فاخر، عرض فلكلوري شرقي ورقص نيران، ورصد النجوم والكواكب بالتليسكوب الفلكي.',
        },
        de: {
          title: 'Super Safari Scharm El-Scheich: Quad, Kamel, BBQ-Show & Sternenbeobachtung',
          description: 'Der ultimative Wüstenabend: Quad-Fahrt, Kamelreiten, Beduinen-BBQ-Abendessen, faszinierende Feuershow und Sternenbeobachtung mit Teleskopen.',
        },
        ru: {
          title: 'Супер Сафари в Шарм-эль-Шейхе: квадроциклы, верблюды, ужин, шоу и телескопы',
          description: 'Полная программа в пустыне: квадроциклы, катание на верблюдах, ужин-барбекю в бедуинском шатре, восточное огненное шоу и наблюдение за звездами в телескопы.',
        },
        it: {
          title: 'Super Safari Sharm El Sheikh: Quad, Cammello, Cena BBQ e Stelle al Telescopio',
          description: 'Serata indimenticabile nel deserto: corsa in quad, passeggiata a dorso di cammello, cena barbecue con spettacolo di fuoco e osservazione delle stelle con telescopi professionali.',
        },
        fr: {
          title: 'Super Safari à Charm el-Cheikh : Quad, Chameau, Dîner Spectacle & Étoiles',
          description: 'La soirée bédouine par excellence : quad dans le désert, balade à dos de dromadaire, délicieux dîner barbecue, spectacle folklorique et observation des étoiles au télescope.',
        },
        pl: {
          title: 'Super Safari Szarm el-Szejk: Quady, Wielbłądy, Kolacja BBQ, Show i Gwiazdy',
          description: 'Najlepsza noc na pustyni: jazda quadami, przejażdżka na wielbłądach, kolacja grillowa u Beduinów, pokaz tańca z ogniem oraz obserwacja gwiazd przez teleskopy.',
        },
        es: {
          title: 'Super Safari en Sharm El Sheikh: Quad, Camello, Cena BBQ y Estrellas',
          description: 'La velada definitiva en el desierto: quads, paseo en camello, cena barbacoa beduina, espectáculo de fuego y danza, y observación de estrellas con telescopios.',
        },
      },
    },

    {
      slug: 'salama-canyon-blue-hole-dahab-safari',
      type: 'SHARED',
      category: 'Safari',
      status: 'ACTIVE',
      basePriceUSD: 42,
      basePrice: 42,
      adultPrice: 42,
      originalPrice: 60,
      childPrice: 22,
      durationHours: 10,
      duration: '10 Hours',
      maxCapacity: 35,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.9,
      ratingCount: 142,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      highlights: [
        '4x4 Jeep ride deep into Sinai desert to hike through vibrant Salama Colored Canyon',
        'Camel ride along the rugged coast of the Gulf of Aqaba',
        'Snorkeling at the world-famous Blue Hole Dahab reef sanctuary',
        'Fresh seaside Bedouin lunch served right at the Dahab coast',
        'Free time to explore the bohemian town and colorful bazaars of Dahab',
      ],
      inclusions: [
        'Round-trip hotel transfers in 4x4 Jeep or air-conditioned vehicle',
        'Guided hike through Salama Canyon rock formations',
        'Camel ride by the beach in Dahab',
        'Seaside lunch at a coastal Bedouin restaurant in Dahab',
        'Blue Hole area visit with snorkeling guide',
        'Free shopping time in Dahab town',
      ],
      exclusions: [
        'Snorkeling equipment rental',
        'Beverages at the restaurant',
        'Blue Hole marine protectorate fee (if required on entry)',
      ],
      translations: {
        en: {
          title: 'Salama Colored Canyon & Blue Hole Dahab with Snorkeling & Lunch',
          description: 'A multi-adventure day expedition: trek through the breathtaking sandstone formations of Salama Canyon, ride camels along the coastline, snorkel at the legendary Blue Hole in Dahab, and enjoy seaside dining.',
        },
        ar: {
          title: 'رحلة كانيون سلامة والـ بلو هول دهب مع الغداء وركوب الجمال',
          description: 'مغامرة صحراوية وبحرية متكاملة لزيارة وادي الكانيون الملون (سلامة) بجباله الخلابة، وركوب الجمال على شاطئ دهب، والسنوركلينج في أسطورة البلو هول العالمية مع غداء بحري شهي وجولة حرة في دهب.',
        },
        de: {
          title: 'Salama Colored Canyon & Blue Hole Dahab mit Schnorcheln & Mittagessen',
          description: 'Ein abwechslungsreiches Abenteuer: Wandern Sie durch die bunten Felsformationen des Salama Canyon, reiten Sie auf Kamelen, schnorcheln Sie im weltberühmten Blue Hole in Dahab und speisen Sie am Meer.',
        },
        ru: {
          title: 'Цветной каньон Салама, Голубая Дыра в Дахабе, верблюды и обед',
          description: 'Удивительное путешествие: пеший поход по живописному каньону Салама, катание на верблюдах вдоль побережья, снорклинг в легендарной Голубой Дыре (Blue Hole), обед у моря и шопинг в Дахабе.',
        },
        it: {
          title: 'Canyon Colorato Salama e Blue Hole Dahab con Snorkeling e Pranzo',
          description: 'Una giornata completa di avventura: trekking nello spettacolare Canyon di Salama, passeggiata in cammello sul mare, snorkeling nel famoso Blue Hole di Dahab e pranzo panoramico.',
        },
        fr: {
          title: 'Canyon Coloré de Salama & Blue Hole Dahab avec Snorkeling & Déjeuner',
          description: 'Une journée d’expédition riche en découvertes : randonnée dans le Canyon de Salama, balade à dos de chameau, snorkeling au légendaire Blue Hole de Dahab et déjeuner en bord de mer.',
        },
        pl: {
          title: 'Kolorowy Kanion Salama i Blue Hole w Dahab ze Snurkowaniem i Obiadem',
          description: 'Niezwykła wyprawa: trekking przez malowniczy Kanion Salama, przejażdżka na wielbłądach brzegiem morza, snurkowanie w słynnym Blue Hole oraz obiad w nadmorskiej restauracji.',
        },
        es: {
          title: 'Cañón Coloreado Salama y Blue Hole en Dahab con Snorkel y Almuerzo',
          description: 'Una excursión completa: caminata por el fascinante Cañón Salama, paseo en camello junto al mar, snorkel en el legendario Blue Hole de Dahab y almuerzo frente a la playa.',
        },
      },
    },

    {
      slug: 'mount-moses-st-catherine-sunrise-hike',
      type: 'SHARED',
      category: 'Cultural',
      status: 'ACTIVE',
      basePriceUSD: 42,
      basePrice: 42,
      adultPrice: 42,
      originalPrice: 60,
      childPrice: 25,
      durationHours: 14,
      duration: '14 Hours (Overnight)',
      maxCapacity: 30,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 4.8,
      ratingCount: 115,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
        'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
        'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80',
      ],
      highlights: [
        'Night-time pilgrimage hike up Mount Moses (Mount Sinai, 2,285m)',
        'Unforgettable golden sunrise view across the jagged peaks of Sinai',
        'Descend to explore the 6th-century UNESCO World Heritage St. Catherine Monastery',
        'View the biblical Burning Bush and the ancient Church of the Transfiguration',
        'Accompanied by an experienced local Bedouin mountain guide',
      ],
      inclusions: [
        'Round-trip transfers from Sharm El Sheikh hotels in air-conditioned bus',
        'Licensed local Bedouin guide for Mount Sinai ascent',
        'Entrance tickets to St. Catherine Monastery complex',
        'Breakfast box included after the mountain descent',
      ],
      exclusions: [
        'Optional camel ride up the mountain path (negotiable on site with Bedouins)',
        'Monastery museum/icon gallery special entrance (optional)',
        'Personal warm clothing & hiking flashlights',
      ],
      translations: {
        en: {
          title: 'Mount Moses (Sinai) Sunrise & St. Catherine Monastery Hike',
          description: 'Climb the sacred Mount Sinai under a blanket of stars to witness a miraculous sunrise over biblical mountain peaks. Descend to tour St. Catherine\'s Monastery, the world\'s oldest continuously operating Christian monastery and the Burning Bush.',
        },
        ar: {
          title: 'رحلة شروق جبل موسى ودير سانت كاترين من شرم الشيخ',
          description: 'صعود ليلي ملهم لجبل موسى المقدس في سيناء لمشاهدة مشهد شروق الشمس المهيب فوق قمم الجبال، ثم النزول لزيارة دير سانت كاترين التاريخي المسجل باليونسكو ورؤية العليقة المقدسة وأقدم كنيسة عامرة.',
        },
        de: {
          title: 'Sonnenaufgang auf dem Mosesberg & Katharinenkloster',
          description: 'Erklimmen Sie den heiligen Berg Sinai in der Nacht und erleben Sie einen unvergesslichen Sonnenaufgang. Besichtigen Sie anschließend das historische Katharinenkloster mit dem Brennenden Dornbusch.',
        },
        ru: {
          title: 'Восхождение на гору Моисея на рассвете и монастырь Св. Екатерины',
          description: 'Ночной подъем на священную гору Моисея (Синай) для встречи невероятного рассвета над вершинами гор, с последующей экскурсией в древнейший монастырь Святой Екатерины и к Неопалимой Купине.',
        },
        it: {
          title: 'Alba sul Monte Sinai (Mosè) e Monastero di Santa Caterina',
          description: 'Salita notturna sul Sacro Monte Sinai per assistere all’alba dorata sulle vette bibliche. Visita al millenario Monastero di Santa Caterina e al Rovo Ardente.',
        },
        fr: {
          title: 'Lever de Soleil sur le Mont Sinaï & Monastère Sainte-Catherine',
          description: 'Ascension nocturne du mont Moïse pour contempler un lever de soleil grandiose sur le désert du Sinaï, suivie de la visite du monastère historique Sainte-Catherine et du Buisson Ardent.',
        },
        pl: {
          title: 'Wschód Słońca na Górze Mojżesza i Klasztor św. Katarzyny',
          description: 'Nocne wejście na Górę Synaj, by podziwiać zapierający dech w piersiach wschód słońca. Zwiedzanie zabytkowego Klasztoru św. Katarzyny z Krzewem Gorejącym.',
        },
        es: {
          title: 'Amanecer en el Monte Sinaí (Moisés) y Monasterio de Santa Catalina',
          description: 'Subida nocturna al sagrado Monte Sinaí para contemplar un amanecer mágico sobre las cumbres, seguido de la visita al histórico Monasterio de Santa Catalina y la Zarza Ardiente.',
        },
      },
    },

    {
      slug: 'scuba-diving-white-island-ras-mohamed',
      type: 'SHARED',
      category: 'Sea',
      status: 'ACTIVE',
      basePriceUSD: 55,
      basePrice: 55,
      adultPrice: 55,
      originalPrice: 80,
      childPrice: 40,
      durationHours: 8,
      duration: '8 Hours',
      maxCapacity: 25,
      hotelPickupIncluded: true,
      allowPayAtLocation: true,
      ratingAverage: 5.0,
      ratingCount: 154,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
        'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80',
      ],
      highlights: [
        'One-on-one guided scuba dive with certified PADI dive instructor (intro or certified)',
        'Dive into world-famous coral drop-offs teeming with sea turtles, rays, and exotic fish',
        'Stop at the pristine white sandbank of the Egyptian Maldives (White Island)',
        'Full scuba diving equipment included: tank, BCD, regulator, suit, weights, mask & fins',
        'Freshly cooked open buffet lunch and unlimited hot/cold drinks aboard luxury yacht',
      ],
      inclusions: [
        'Round-trip hotel transfers in air-conditioned vehicles',
        'VIP luxury yacht day cruise with spacious sun deck',
        'Full complete scuba diving equipment set',
        'Professional 1-on-1 PADI instructor for beginners / divemaster for certified',
        'Open buffet lunch and soft drinks/hot beverages throughout the day',
        'National park marine permits and entry tickets',
      ],
      exclusions: [
        'Underwater photography and video footage package',
        'Personal gratuities',
      ],
      translations: {
        en: {
          title: 'Scuba Diving Experience at White Island & Ras Mohamed (Intro / Certified)',
          description: 'Plunge into the Red Sea’s world-class underwater kingdom. Enjoy guided scuba diving with certified instructors at Ras Mohamed and visit the breathtaking White Island, complete with full gear and gourmet yacht dining.',
        },
        ar: {
          title: 'تجربة الغطس (دايفنج) في رأس محمد والجزيرة البيضاء (مبتدئين ومحترفين)',
          description: 'اكتشف عالم أعماق البحر الأحمر الساحر مع غطسة تجريبية برفقة مدرب غطس PADI محترف واحد لواحد، مع زيارة الجزيرة البيضاء، وبوفيه غداء مأكولات بحرية ومعدات الغطس كاملة.',
        },
        de: {
          title: 'Taucherlebnis bei White Island & Ras Mohamed (Schnuppertauchen / Zertifiziert)',
          description: 'Tauchen Sie ein in das weltberühmte Unterwasserreich des Roten Meeres. Geführte Tauchgänge mit PADI-Tauchlehrer, Besuch von White Island und feines Buffet an Bord.',
        },
        ru: {
          title: 'Дайвинг на Белом Острове и в Рас Мохаммеде (для новичков и сертифицированных)',
          description: 'Погружение с аквалангом в легендарные коралловые сады Рас Мохаммеда с персональным инструктором PADI, высадка на Белый остров и изысканный обед на борту комфортабельной яхты.',
        },
        it: {
          title: 'Esperienza di Immersione Subacquea a White Island e Ras Mohamed',
          description: 'Immergiti nel regno sottomarino del Mar Rosso con un istruttore PADI qualificato. Visita White Island ed esplora spettacolari barriere coralline con pranzo a bordo.',
        },
        fr: {
          title: 'Plongée Sous-Marine à White Island & Ras Mohamed (Débutants / Certifiés)',
          description: 'Explorez les fonds marins exceptionnels de la mer Rouge avec un moniteur PADI. Plongée guidée, découverte de White Island et déjeuner gastronomique sur le yacht.',
        },
        pl: {
          title: 'Nurkowanie z Akwalungiem przy White Island i Ras Mohamed',
          description: 'Zanurz się w podwodnym raju Morza Czerwonego pod opieką instruktora PADI. Nurkowanie na rafach Ras Mohamed, relaks na White Island i obiad na jachcie.',
        },
        es: {
          title: 'Experiencia de Buceo en Isla Blanca y Ras Mohamed (Intro / Certificados)',
          description: 'Sumérgete en los impresionantes fondos marinos del Mar Rojo con instructores certificados PADI. Buceo guiado en Ras Mohamed, visita a Isla Blanca y almuerzo a bordo.',
        },
      },
    },
  ];

  for (const tourData of toursToSeed) {
    const existing = await prisma.tour.findUnique({
      where: { slug: tourData.slug },
    });

    if (existing) {
      const updated = await prisma.tour.update({
        where: { slug: tourData.slug },
        data: tourData,
      });
      console.log(`Updated tour: ${tourData.slug} (ID: ${updated.id})`);
    } else {
      const created = await prisma.tour.create({
        data: tourData,
      });
      console.log(`Created tour: ${tourData.slug} (ID: ${created.id})`);
    }
  }

  console.log('--- All 9 Sharm El Sheikh tours successfully created/updated! ---');
}

main()
  .catch((err) => {
    console.error('Error seeding Sharm El Sheikh tours:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
