const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Step 1: Verifying / Updating Destination: Marsa Alam ---');

  let dest = await prisma.destination.findFirst({
    where: {
      OR: [
        { slug: 'marsa-alam' },
        { name: { contains: 'Marsa Alam', mode: 'insensitive' } },
      ],
    },
  });

  const marsaData = {
    name: 'Marsa Alam',
    slug: 'marsa-alam',
    countryCode: 'EG',
    region: 'Red Sea Governorate',
    city: 'Marsa Alam',
    latitude: 25.0676,
    longitude: 34.8790,
    timezone: 'Africa/Cairo',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    description: 'Egypt’s premier eco-paradise and pristine coastal sanctuary, world-renowned for wild spinner dolphins, sea cows (dugongs), giant green sea turtles, and untouched virgin coral reefs.',
    translations: {
      en: {
        name: 'Marsa Alam',
        description: 'Egypt’s premier eco-paradise and pristine coastal sanctuary, world-renowned for wild spinner dolphins, sea cows (dugongs), giant green sea turtles, and untouched virgin coral reefs.',
      },
      ar: {
        name: 'مرسى علم',
        description: 'مالديف مصر وجنة البحر الأحمر البكر، تشتهر بخلجان الدلافين الدوارة، وعروس البحر الساحرة (الدوجونج)، والسلاحف الخضراء العملاقة وأروع الشعاب المرجانية العذراء.',
      },
      de: {
        name: 'Marsa Alam',
        description: 'Ägyptens unberührtes Naturparadies am Roten Meer, weltbekannt für Delfin-Riffe, Seekühe (Dugongs), Riesenschildkröten und spektakuläre Korallengärten.',
      },
      ru: {
        name: 'Марса Алам',
        description: 'Экологический рай Красного моря, знаменитый дикими дельфинами, морскими коровами (дюгонями), гигантскими черепахами и нетронутыми коралловыми рифами.',
      },
      it: {
        name: 'Marsa Alam',
        description: 'Il paradiso incontaminato d’Egitto, celebre nel mondo per i delfini selvatici, i dugonghi, le tartarughe giganti e le spettacolari barriere coralline vergini.',
      },
      fr: {
        name: 'Marsa Alam',
        description: 'Le sanctuaire sauvage et préservé d’Égypte, réputé pour ses récifs coralliens intacts, ses dauphins sauvages, ses dugongs et ses tortues marines géantes.',
      },
      pl: {
        name: 'Marsa Alam',
        description: 'Dziki raj Morza Czerwonego, słynący z dziewiczych raf koralowych, spotkań z delfinami, krowami morskimi (dugonie) i żółwiami morskimi.',
      },
      es: {
        name: 'Marsa Alam',
        description: 'El paraíso ecológico virgen de Egipto, famoso por los delfines salvajes, manatíes (dugongos), tortugas marinas gigantes y arrecifes de coral intactos.',
      },
    },
  };

  if (dest) {
    dest = await prisma.destination.update({
      where: { id: dest.id },
      data: marsaData,
    });
    console.log('Updated destination Marsa Alam:', dest.id);
  } else {
    dest = await prisma.destination.create({
      data: marsaData,
    });
    console.log('Created destination Marsa Alam:', dest.id);
  }

  console.log('--- Step 2: Ensuring Marsa Alam Pickup Zones ---');
  const zoneConfigs = [
    { name: 'Marsa Alam Center', transferFee: 0, pickupOffset: 0, pickupWindow: '07:30 - 08:00' },
    { name: 'Port Ghalib', transferFee: 5, pickupOffset: 15, pickupWindow: '07:45 - 08:15' },
    { name: 'Abu Dabbab & Coraya', transferFee: 10, pickupOffset: 25, pickupWindow: '07:15 - 07:45' },
    { name: 'El Quseir', transferFee: 20, pickupOffset: 45, pickupWindow: '06:45 - 07:15' },
    { name: 'Wadi Lahmy & Hamata', transferFee: 25, pickupOffset: 60, pickupWindow: '06:15 - 06:45' },
  ];

  const zones = {};
  for (const z of zoneConfigs) {
    const existing = await prisma.zone.findFirst({
      where: { name: z.name },
    });
    if (existing) {
      zones[z.name] = await prisma.zone.update({
        where: { id: existing.id },
        data: { destinationId: dest.id, transferFee: z.transferFee, pickupOffset: z.pickupOffset, pickupWindow: z.pickupWindow, isActive: true },
      });
    } else {
      zones[z.name] = await prisma.zone.create({
        data: { name: z.name, destinationId: dest.id, transferFee: z.transferFee, pickupOffset: z.pickupOffset, pickupWindow: z.pickupWindow, isActive: true },
      });
    }
  }

  // Also check existing "Marsa Alam" zone
  const legacyMarsaZone = await prisma.zone.findFirst({ where: { name: 'Marsa Alam' } });
  if (legacyMarsaZone) {
    await prisma.zone.update({
      where: { id: legacyMarsaZone.id },
      data: { destinationId: dest.id, transferFee: 0, isActive: true },
    });
    zones['Marsa Alam'] = legacyMarsaZone;
  }

  const primaryZoneId = zones['Port Ghalib']?.id || zones['Marsa Alam Center']?.id || legacyMarsaZone?.id;

  console.log('--- Step 3: Seeding 11 Marsa Alam Tours (from Roadmap Section 73) ---');

  const toursToSeed = [
    {
      slug: 'marsa-mubarak-snorkeling-dugong-sea-turtles',
      category: 'Sea',
      basePriceUSD: 50,
      adultPrice: 50,
      originalPrice: 75,
      childPrice: 25,
      infantPrice: 0,
      durationHours: 8,
      duration: '8 Hours',
      durationDisplay: '8 Hours (Full Day Boat Trip)',
      maxCapacity: 30,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
        'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&q=80',
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
      ],
      isFeatured: true,
      isBestSeller: true,
      isRecommended: true,
      ratingAverage: 4.9,
      ratingCount: 38,
      status: 'ACTIVE',
      vehicleType: 'Air-Conditioned Minivan',
      boatType: 'Luxury Snorkeling Yacht',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['08:00', '08:30'],
      translations: {
        en: {
          title: 'Marsa Mubarak Snorkeling Trip: Sea Cow (Dugong) & Giant Sea Turtles',
          description: 'Sail to the world-famous Marsa Mubarak bay, celebrated globally as the natural grazing sanctuary of the rare sea cow (dugong) and giant green sea turtles. Enjoy 2 guided snorkeling stops, full snorkel gear, and freshly prepared chef buffet lunch on board.',
          highlights: [
            'Guided boat excursion to the protected bay of Marsa Mubarak',
            'Rare opportunity to spot the endangered sea cow (dugong) in its natural habitat',
            'Swim alongside magnificent giant green sea turtles over seagrass meadows',
            'Vibrant coral reef gardens teeming with exotic Red Sea marine life',
            'Open-buffet lunch with seafood, grilled chicken, fresh salads & soft drinks',
          ],
          inclusions: ['Round-trip hotel transfers in air-conditioned vehicle', 'Luxury yacht cruise with sun deck and shaded lounge', 'Snorkeling equipment (mask, snorkel, fins, life jacket)', 'Certified marine snorkeling guide', 'Buffet lunch on board + unlimited soft drinks, tea & coffee'],
          exclusions: ['National park environmental protection fee ($5 per person on board)', 'Underwater professional photo/video album (optional)'],
          whatToBring: 'Swimwear, beach towels, sunglasses, sun protection, waterproof camera or phone pouch.',
        },
        ar: {
          title: 'رحلة مرسى مبارك باليخت: مشاهدة عروس البحر (الدوجونج) والسلاحف الخضراء',
          description: 'انطلق في أروع رحلة بحرية إلى خليج مرسى مبارك الشهير، موطن عروس البحر النادرة (الدوجونج) ومستعمرات السلاحف الخضراء العملاقة. تشمل وقفتين سنوركلينج برفقة مرشد محترف، بوفيه غداء طازج ومعدات كاملة.',
          highlights: [
            'إبحار فاخر إلى محمية خليج مرسى مبارك الشهيرة عالمياً',
            'فرصة نادرة لمشاهدة عروس البحر (الدوجونج) في بيئتها الطبيعية',
            'السباحة بجوار السلاحف البحرية الخضراء العملاقة',
            'بوفيه غداء مفتوح شهي ومشروبات منعشة طوال اليوم',
          ],
          inclusions: ['الانتقالات ذهاباً وإياباً من الفندق', 'يخت سياحي مجهز بالكامل', 'أدوات السنوركلينج كاملة', 'مرشد غطس وسنوركلينج معتمد', 'بوفيه غداء ومشروبات مفتوحة طوال الرحلة'],
          exclusions: ['رسوم المحمية البحرية (5 دولارات للفرد)', 'التصوير الفوتوغرافي الاختياري'],
          whatToBring: 'ملابس السباحة، فوطة بحر، نظارة شمس، واقي شمس، كاميرا مقاومة للماء.',
        },
      },
    },
    {
      slug: 'sataya-dolphin-reef-marsa-alam',
      category: 'Sea',
      basePriceUSD: 65,
      adultPrice: 65,
      originalPrice: 90,
      childPrice: 35,
      infantPrice: 0,
      durationHours: 9,
      duration: '9 Hours',
      durationDisplay: '9 Hours (Full Day Dolphin Expedition)',
      maxCapacity: 35,
      coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      isFeatured: true,
      isBestSeller: true,
      isRecommended: true,
      isVip: true,
      ratingAverage: 5.0,
      ratingCount: 52,
      status: 'ACTIVE',
      vehicleType: 'Air-Conditioned VIP Coach',
      boatType: 'Spacious Multi-Deck Yacht',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['06:30', '07:00'],
      translations: {
        en: {
          title: 'Sataya Dolphin Reef / Dolphin House Snorkeling Yacht Expedition',
          description: 'A once-in-a-lifetime expedition to Sataya Reef (Dolphin House) in southern Marsa Alam. Home to large pods of wild spinner dolphins that play and swim freely in turquoise lagoons.',
          highlights: [
            'Sail to Sataya Reef lagoon, the greatest wild spinner dolphin sanctuary in the Red Sea',
            'Swim safely alongside wild dolphins in crystal-clear azure waters',
            'Two extensive snorkeling sessions on untouched outer barrier reefs',
            'Chef-prepared gourmet seafood & BBQ buffet served on board',
          ],
          inclusions: ['Hotel pick-up and drop-off in comfortable AC vehicle', 'Full-day yacht cruise with shaded lounges and sundeck', 'Snorkel gear and life jackets included', 'Certified marine dolphin guides', 'Full buffet lunch, seasonal fruits & soft drinks'],
          exclusions: ['Sataya marine protectorate ticket ($5)', 'Personal souvenir photos'],
          whatToBring: 'Passport copy, swimwear, towels, sun lotion, sunglasses.',
        },
        ar: {
          title: 'رحلة شعاب سطايح (بيت الدلافين) باليخت مع السباحة مع الدلافين الحرة',
          description: 'رحلة العمر إلى شعاب سطايح الساحرة جنوب مرسى علم، الملاذ الطبيعي لعشرات الدلافين الدوارة الحرة. استمتع بالسباحة مع الدلافين في مياه فيروزية لا مثيل لها وبوفيه غداء بحري فاخر.',
          highlights: ['السباحة بجوار الدلافين الدوارة الحرة في بيئتها الطبيعية', 'وقفتان سنوركلينج في أصفى بقعة بحرية بالبحر الأحمر', 'غداء بوفيه مفتوح ومشروبات طوال اليوم'],
          inclusions: ['الانتقالات من وإلى الفندق', 'رحلة يخت فاخر طوال اليوم', 'معدات السنوركلينج وسترات النجاة', 'غداء متكامل ومشروبات'],
          exclusions: ['رسوم المحمية البحرية'],
          whatToBring: 'ملابس السباحة، فوطة، واقي شمس، نظارة شمس.',
        },
      },
    },
    {
      slug: 'marsa-alam-super-safari-quad-bedouin-dinner',
      category: 'Safari',
      basePriceUSD: 45,
      adultPrice: 45,
      originalPrice: 65,
      childPrice: 25,
      infantPrice: 0,
      durationHours: 6,
      duration: '6 Hours',
      durationDisplay: '6 Hours (Afternoon & Sunset)',
      maxCapacity: 40,
      coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
      ],
      isFeatured: true,
      isBestSeller: true,
      ratingAverage: 4.9,
      ratingCount: 29,
      status: 'ACTIVE',
      vehicleType: '4x4 Toyota Land Cruiser & ATV Quad',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['14:00', '14:30'],
      translations: {
        en: {
          title: 'Marsa Alam Super Safari: ATV Quad Bike, Camel Ride, Bedouin BBQ & Stargazing',
          description: 'Experience the raw beauty of the Eastern Desert. Drive powerful ATV quads across mountain trails, ride camels in traditional Bedouin style, savor an open-air barbecue feast, and view desert constellations through astronomical telescopes.',
          highlights: [
            '45-minute ATV quad bike desert adventure through scenic canyons',
            '4x4 Land Cruiser desert dune drive to an authentic Bedouin village',
            'Traditional camel trek across golden desert sands',
            'Bedouin herbal tea ceremony, fresh bread baking demonstration & BBQ dinner',
            'Live Oriental folklore show (Tanoura dance, fire show, oriental music)',
            'Stargazing experience with astronomy guide and digital telescope',
          ],
          inclusions: ['Hotel pick-up and return in 4x4 Jeep', 'Quad bike ride with safety helmet', 'Camel ride', 'Bedouin village tour & dinner buffet with soft drinks', 'Evening folklore show & telescope stargazing session'],
          exclusions: ['Desert scarf (keffiyeh) & dust goggles (available for purchase/rent)', 'Shisha (optional)'],
          whatToBring: 'Comfortable sport clothes, sunglasses, scarf, closed footwear.',
        },
        ar: {
          title: 'سوبر سفاري مرسى علم: بيتش باجي (كواد)، ركوب جمال، عشاء بدوي ورصد النجوم',
          description: 'عش مغامرة الصحراء الشرقية الحقيقية في مرسى علم. قيادة البيتش باجي وسط الجبال، ركوب الجمال، زيارة قرية بدوية مع عشاء مشاوي فاخر، وعرض فلكلوري ورصد النجوم بالتلسكوب.',
          highlights: ['قيادة بيتش باجي في دروب الصحراء', 'ركوب الجمال بالطريقة البدوية الأصيلة', 'عشاء بوفيه مشاوي بدوي مع الشاي العشبي', 'عرض شرقي وعرض النار ورصد النجوم بالتلسكوب'],
          inclusions: ['الانتقالات بسيارات الدفع الرباعي 4x4', 'رحلة البيتش باجي وخوذة الأمان', 'ركوب الجمال وعشاء البوفيه المفتوح والمشروبات', 'جلسة رصد النجوم والعرض الفني'],
          exclusions: ['الشال والنظارة الواقية من الغبار'],
          whatToBring: 'ملابس مريحة، حذاء رياضي مغلق، نظارة شمس.',
        },
      },
    },
    {
      slug: 'hamata-islands-snorkeling-egyptian-maldives',
      category: 'Sea',
      basePriceUSD: 58,
      adultPrice: 58,
      originalPrice: 85,
      childPrice: 30,
      infantPrice: 0,
      durationHours: 9,
      duration: '9 Hours',
      durationDisplay: '9 Hours (Island Hopping Cruise)',
      maxCapacity: 30,
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      isFeatured: true,
      isBestSeller: true,
      isVip: true,
      ratingAverage: 4.9,
      ratingCount: 44,
      status: 'ACTIVE',
      vehicleType: 'Air-Conditioned VIP Van',
      boatType: 'Luxury Cruise Yacht',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['06:00', '06:30'],
      translations: {
        en: {
          title: 'Hamata Islands Snorkeling Tour: The Egyptian Maldives (Qulaan Archipelago)',
          description: 'Discover the untamed paradise of the Hamata Islands (Qulaan archipelago), famously crowned the Egyptian Maldives. Step onto powdery white sand spits, explore untouched turquoise lagoons, and snorkel over thriving virgin coral reefs.',
          highlights: [
            'Full-day island-hopping cruise to the pristine Hamata archipelago',
            'Walk on white sandy atolls surrounded by fluorescent turquoise waters',
            'Two long snorkeling sessions over some of the most vibrant coral reefs in the world',
            'Freshly prepared onboard buffet with seafood & seasonal dishes',
          ],
          inclusions: ['Hotel transfers in air-conditioned vehicle', 'Full-day boat cruise with sun decks', 'Snorkel gear (mask, snorkel, fins)', 'Expert marine guide', 'Delicious buffet lunch + soft drinks and water'],
          exclusions: ['Hamata national park conservation fee ($5)', 'Personal photo session'],
          whatToBring: 'Passports, swimming gear, beach towels, sun cream.',
        },
        ar: {
          title: 'رحلة جزر حماطة (مالديف مصر) باليخت والسنوركلينج',
          description: 'اكتشف أرخبيل جزر حماطة المذهل المعروف بـ "مالديف مصر". شواطئ رملية بيضاء فائقة النعومة، مياه فيروزية صافية، وأروع جزر طبيعية عذراء مع بوفيه غداء فاخر على اليخت.',
          highlights: ['النزول على جزر حماطة ذات الرمال البيضاء الساحرة', 'السنوركلينج في محمية حماطة البكر', 'غداء بوفيه مفتوح ومشروبات طوال اليوم'],
          inclusions: ['الانتقالات من وإلى الفندق', 'رحلة اليخت طوال اليوم', 'معدات السنوركلينج', 'بوفيه الغداء والمشروبات'],
          exclusions: ['رسوم المحمية الطبيعية'],
          whatToBring: 'جواز السفر، ملابس السباحة، فوطة بحر، واقي شمس.',
        },
      },
    },
    {
      slug: 'abu-dabbab-bay-turtles-dugong-snorkeling',
      category: 'Sea',
      basePriceUSD: 38,
      adultPrice: 38,
      originalPrice: 55,
      childPrice: 20,
      infantPrice: 0,
      durationHours: 6,
      duration: '6 Hours',
      durationDisplay: '6 Hours (Beach & Snorkel Relax)',
      maxCapacity: 45,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      isFeatured: false,
      isBestSeller: true,
      ratingAverage: 4.8,
      ratingCount: 31,
      status: 'ACTIVE',
      vehicleType: 'Air-Conditioned Bus',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['08:30', '09:00'],
      translations: {
        en: {
          title: 'Abu Dabbab Bay Snorkeling Experience: Giant Green Turtles & Beach Day',
          description: 'Spend an idyllic day at the world-famous Abu Dabbab Bay, celebrated for its sandy entrance and resident population of gentle giant green turtles and elusive sea cows grazing in shallow seagrass beds.',
          highlights: [
            'Direct beach access — easy walk-in snorkeling ideal for all ages and skill levels',
            'Close encounters with massive green sea turtles in their natural habitat',
            'Pristine sandy beach with sunbeds, umbrellas, and beachside facilities',
            'Rich house reef with colorful reef fish, rays, and coral formations',
          ],
          inclusions: ['Round-trip hotel transfers', 'Abu Dabbab beach resort entrance ticket with sunbed & umbrella', 'Snorkeling equipment', 'Snorkel guide assistance'],
          exclusions: ['Lunch (optional upgrade or available at beachfront restaurant)', 'Beverages'],
          whatToBring: 'Beach towel, sunscreen, sunglasses, camera.',
        },
        ar: {
          title: 'يوم شاطئي وسنوركلينج في خليج أبو دباب (شاطئ السلاحف العملاقة)',
          description: 'قضاء يوم استرخاء استثنائي على شاطئ خليج أبو دباب الرملي الساحر. سنوركلينج مباشر من الشاطئ لمشاهدة السلاحف البحرية العملاقة وعروس البحر وسط الشعاب المرجانية الخلابة.',
          highlights: ['دخول شاطئ أبو دباب مع شمسية وشيزلونج', 'سنوركلينج سهل من الشاطئ مناسب لجميع الأعمار', 'مشاهدة السلاحف الخضراء العملاقة عن قرب'],
          inclusions: ['الانتقالات من وإلى الفندق', 'تذكرة دخول شاطئ أبو دباب واستخدام الشيزلونجات', 'معدات السنوركلينج'],
          exclusions: ['الوجبات والمشروبات (متاحة في المطعم الشاطئي)'],
          whatToBring: 'فوطة بحر، واقي شمس، نظارة شمس.',
        },
      },
    },
    {
      slug: 'royal-sea-scope-semi-submarine-marsa-alam',
      category: 'Sea',
      basePriceUSD: 35,
      adultPrice: 35,
      originalPrice: 50,
      childPrice: 18,
      infantPrice: 0,
      durationHours: 3,
      duration: '3 Hours',
      durationDisplay: '3 Hours (Submarine Reef Explorer)',
      maxCapacity: 50,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      isFeatured: false,
      isFamilyFriendly: true,
      ratingAverage: 4.8,
      ratingCount: 22,
      status: 'ACTIVE',
      vehicleType: 'Air-Conditioned Minivan',
      boatType: 'Air-Conditioned Semi-Submarine Vessel',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['09:00', '13:00'],
      translations: {
        en: {
          title: 'Royal Sea Scope Semi-Submarine: Underwater Coral Reef Explorer',
          description: 'Descend 3 meters below sea level inside an air-conditioned observation deck with panoramic glass windows. Marvel at Marsa Alam’s vibrant coral pinnacles, sea turtles, and kaleidoscopic marine life without getting wet.',
          highlights: [
            'Underwater observation salon with giant panoramic underwater viewing windows',
            'Perfect family-friendly marine experience for kids and non-swimmers',
            'Opportunity to spot sea turtles, stingrays, and exotic reef fish up close',
            'Upper deck cruise for stunning coastline views and gentle sea breeze',
          ],
          inclusions: ['Hotel pick-up and drop-off', 'Semi-submarine cruise ticket', 'Air-conditioned underwater cabin seating', 'Soft drink or mineral water'],
          exclusions: ['Personal photo services'],
          whatToBring: 'Camera, sunglasses.',
        },
        ar: {
          title: 'رويال سي سكوب (الغواصة سيمي سابمارين) في مرسى علم',
          description: 'انزل على عمق 3 أمتار تحت سطح البحر في قاعة زجاجية مكيفة بنوافذ بانورامية عملاقة لمشاهدة الشعاب المرجانية النادرة وسلاحف البحر الأحمر بدون أن تبتل. مثالية للعائلات والأطفال.',
          highlights: ['صالون مكيف تحت الماء بنوافذ زجاجية بانورامية', 'تجربة عائلية رائعة مناسبة لجميع الأعمار والأطفال', 'مشاهدة الأسماك الملونة والشعاب المرجانية والسلاحف'],
          inclusions: ['الانتقالات من وإلى الفندق', 'تذكرة الغواصة كاملة', 'مشروب خفيف'],
          exclusions: ['الصور التذكارية'],
          whatToBring: 'كاميرا، نظارة شمس.',
        },
      },
    },
    {
      slug: 'nefertari-pharaonic-sea-experience-marsa-alam',
      category: 'Sea',
      basePriceUSD: 55,
      adultPrice: 55,
      originalPrice: 80,
      childPrice: 28,
      infantPrice: 0,
      durationHours: 5,
      duration: '5 Hours',
      durationDisplay: '5 Hours (VIP Luxury Pharaonic Cruise)',
      maxCapacity: 40,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      isFeatured: true,
      isVip: true,
      ratingAverage: 4.9,
      ratingCount: 19,
      status: 'ACTIVE',
      vehicleType: 'Air-Conditioned VIP Minivan',
      boatType: 'Pharaonic Royal Submarine Yacht',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['09:00', '13:30'],
      translations: {
        en: {
          title: 'Nefertari Pharaonic Luxury Sea Experience & Submarine Cruise',
          description: 'Sail aboard an extraordinary replica of an ancient Egyptian royal solar bark, equipped with an air-conditioned glass underwater salon, royal sun decks, and gourmet dining served by crew in traditional pharaonic attire.',
          highlights: [
            'Sail on a unique royal pharaonic vessel with regal historic design',
            'Sub-surface glass salon for observing Marsa Alam’s marine life in total luxury',
            'Snorkeling stop at a pristine outer reef with full equipment provided',
            'Gourmet lunch or dinner with fresh seafood and pharaonic royal hospitality',
          ],
          inclusions: ['Hotel pick-up and return', 'Cruise aboard the Nefertari pharaonic ship', 'Snorkel gear and life jackets', 'Buffet meal with soft drinks'],
          exclusions: ['Gratuities', 'Professional photo album'],
          whatToBring: 'Camera, swimwear, beach towel, sunglasses.',
        },
        ar: {
          title: 'مركب نفرتاري الفرعونية الفاخرة والغواصة البحرية في مرسى علم',
          description: 'أبحر على متن مركب فرعوني ملكي فخم مصمم على طراز المراكب الشمسية الفرعونية ومزود بغواصة زجاجية تحت الماء، مع وقفة سنوركلينج وبوفيه غداء مأكولات بحرية فاخر.',
          highlights: ['تصميم فرعوني أسطوري فريد من نوعه بالبحر الأحمر', 'قاعة زجاجية تحت الماء لمشاهدة الشعاب المرجانية', 'وقفة سنوركلينج مميزة وغداء مأكولات بحرية فاخر'],
          inclusions: ['الانتقالات من وإلى الفندق', 'الرحلة البحرية كاملة', 'أدوات السنوركلينج', 'وجبة الغداء والمشروبات'],
          exclusions: ['الخدمات الاختيارية'],
          whatToBring: 'كاميرا، ملابس سباحة، فوطة، نظارة شمس.',
        },
      },
    },
    {
      slug: 'luxor-valley-of-kings-from-marsa-alam',
      category: 'Cultural',
      basePriceUSD: 110,
      adultPrice: 110,
      originalPrice: 150,
      childPrice: 60,
      infantPrice: 0,
      durationHours: 15,
      duration: '15 Hours',
      durationDisplay: '15 Hours (Full Day Historic Expedition)',
      maxCapacity: 25,
      coverImage: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200&q=80',
        'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80',
      ],
      isFeatured: true,
      isBestSeller: true,
      ratingAverage: 5.0,
      ratingCount: 35,
      status: 'ACTIVE',
      vehicleType: 'Deluxe Air-Conditioned Highway Coach',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['05:00', '05:30'],
      translations: {
        en: {
          title: 'Luxor Day Trip: Valley of the Kings, Karnak Temple & Nile River from Marsa Alam',
          description: 'Cross from the Red Sea into the majestic Nile Valley to explore the monumental wonders of ancient Thebes (Luxor). Visit the Valley of the Kings, Queen Hatshepsut Temple, Colossi of Memnon, and the colossal Karnak Temple complex with an Egyptologist guide.',
          highlights: [
            'Guided exploration of Karnak Temple, the largest religious complex ever built by man',
            'Visit the legendary Valley of the Kings and enter tombs of famous Pharaohs',
            'Marvel at the breathtaking mortuary temple of Queen Hatshepsut at Deir el-Bahari',
            'See the towering Colossi of Memnon statues',
            'Cross the sacred Nile River by traditional motorboat and dine at a riverside restaurant',
          ],
          inclusions: ['Hotel round-trip transfers in air-conditioned deluxe coach', 'Official licensed Egyptologist tour guide', 'Entry tickets to Karnak Temple, Valley of the Kings (3 tombs), and Hatshepsut Temple', 'Nile river crossing by motorboat', 'Fresh lunch at a local restaurant in Luxor'],
          exclusions: ['King Tutankhamun tomb special entry ticket', 'Beverages at the restaurant'],
          whatToBring: 'Original passport, breakfast box from hotel, comfortable walking shoes, sun hat.',
        },
        ar: {
          title: 'رحلة الأقصر ومعابد الفراعنة ووادي الملوك من مرسى علم',
          description: 'رحلة اليوم الواحد الأسطورية من مرسى علم إلى عاصمة الفراعنة الأقصر. زيارة معبد الكرنك العظيم، وادي الملوك ومقابر الفراعنة، معبد حتشبسوت، تمثالي ممنون وركوب مركب في النيل مع مرشد سياحي متخصص.',
          highlights: ['زيارة معبد الكرنك أعظم مجمع ديني في التاريخ القديم', 'دخول مقابر الفراعنة بوادي الملوك', 'معبد الملكة حتشبسوت بالدير البحري وتمثالي ممنون', 'غداء شهي في مطعم مطل على نهر النيل'],
          inclusions: ['الانتقالات بأوتوبيس سياحي فاخر مكيف', 'مرشد سياحي مرخص من وزارة السياحة والآثار', 'تذاكر الدخول للمزارات المدرجة', 'غداء في الأقصر ومعدية النيل'],
          exclusions: ['مقبرة توت عنخ آمون الخاصة', 'المشروبات الإضافية'],
          whatToBring: 'جواز السفر أو بطاقة الرقم القومي، علبة إفطار من الفندق، حذاء مريح، قبعة للشمس.',
        },
      },
    },
    {
      slug: 'cairo-pyramids-grand-egyptian-museum-marsa-alam',
      category: 'Cultural',
      basePriceUSD: 230,
      adultPrice: 230,
      originalPrice: 290,
      childPrice: 190,
      infantPrice: 0,
      durationHours: 18,
      duration: '18 Hours (Flight Trip)',
      durationDisplay: '18 Hours (Private / Small Group by Plane)',
      maxCapacity: 15,
      coverImage: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&q=80',
        'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200&q=80',
      ],
      isFeatured: true,
      isVip: true,
      ratingAverage: 5.0,
      ratingCount: 16,
      status: 'ACTIVE',
      vehicleType: 'Private Limousine & Domestic Flight',
      freeCancellationHours: 48,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['05:00'],
      translations: {
        en: {
          title: 'Cairo, Pyramids of Giza & Grand Egyptian Museum by Flight from Marsa Alam',
          description: 'Fly from Marsa Alam/Hurghada to Cairo for a private VIP day tour of Egypt’s greatest ancient treasures. Stand before the Great Pyramids of Giza and Sphinx, and explore the legendary Grand Egyptian Museum (GEM) with a private Egyptologist.',
          highlights: [
            'Round-trip domestic flights between Red Sea and Cairo (1 hour flight)',
            'Visit the Great Pyramids of Giza (Khufu, Khafre, Menkaure) and the mysterious Sphinx',
            'Explore the Grand Egyptian Museum (GEM), the largest archaeological museum in the world',
            'Private air-conditioned transportation throughout Cairo with Egyptologist guide',
            'Delicious lunch at a high-end restaurant with pyramid views',
          ],
          inclusions: ['Domestic flight tickets round-trip', 'Private airport transfers in Marsa Alam and Cairo', 'Private licensed Egyptologist guide in Cairo', 'Entry tickets to Giza Pyramids area & Grand Egyptian Museum main galleries', 'Gourmet lunch at selected restaurant'],
          exclusions: ['Entry inside the Great Pyramid chambers (optional ticket on site)', 'Personal shopping in Khan El Khalili'],
          whatToBring: 'Original valid passport, comfortable walking shoes, camera.',
        },
        ar: {
          title: 'رحلة القاهرة والأهرامات والمتحف المصري الكبير بالطيران من مرسى علم',
          description: 'سافر بالطائرة من مرسى علم إلى القاهرة في رحلة VIP خاصة تشمل أهرامات الجيزة الخالدة، تمثال أبو الهول، والمتحف المصري الكبير الأضخم عالمياً مع مرشد سياحي خاص وغداء راقٍ.',
          highlights: ['تذاكر طيران داخلي ذهاب وعودة لتوفير الوقت والراحة', 'جولة خاصة عند أهرامات الجيزة وأبو الهول البانورامي', 'زيارة المتحف المصري الكبير (GEM)', 'سيارة خاصة مكيفة ومرشد سياحي خاص طوال اليوم'],
          inclusions: ['تذاكر الطيران ذهاب وعودة', 'الانتقالات الخاصة بسيارة سياحية فاخرة', 'مرشد سياحي خاص', 'تذاكر الدخول المحددة والغداء الفاخر'],
          exclusions: ['دخول الهرم الأكبر من الداخل'],
          whatToBring: 'جواز السفر الأصلي، كاميرا، حذاء مريح.',
        },
      },
    },
    {
      slug: 'wadi-el-gemal-national-park-qulaan-safari',
      category: 'Safari',
      basePriceUSD: 52,
      adultPrice: 52,
      originalPrice: 75,
      childPrice: 26,
      infantPrice: 0,
      durationHours: 7,
      duration: '7 Hours',
      durationDisplay: '7 Hours (Eco-Safari & Mangrove Sanctuary)',
      maxCapacity: 30,
      coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      ],
      isFeatured: false,
      isRecommended: true,
      ratingAverage: 4.8,
      ratingCount: 18,
      status: 'ACTIVE',
      vehicleType: '4x4 Jeep / AC Minibus',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['08:00', '08:30'],
      translations: {
        en: {
          title: 'Wadi El Gemal National Park Safari & Qulaan Mangrove Beach Sanctuary',
          description: 'Explore the protected wilderness of Wadi El Gemal (Valley of the Camels) National Park. Discover coastal mangrove forests at Qulaan Beach, swim in serene turquoise lagoons, and enjoy Bedouin hospitality.',
          highlights: [
            'Expedition through the pristine desert and coastal ecosystems of Wadi El Gemal',
            'Relax at Qulaan Beach with its famous solitary mangrove tree standing in turquoise waters',
            'Snorkel in peaceful bays populated by rays, turtles, and colorful reef fish',
            'Authentic Bedouin coffee (Gabana) ritual and fresh lunch in the nature reserve',
          ],
          inclusions: ['Hotel round-trip transfers in 4x4 or AC vehicle', 'Wadi El Gemal national park entry fees', 'Snorkeling equipment', 'Bedouin lunch with soft drinks and traditional Gabana coffee'],
          exclusions: ['Personal expenses'],
          whatToBring: 'Swimwear, towel, walking shoes, sun hat, sunglasses.',
        },
        ar: {
          title: 'محمية وادي الجمال وشاطئ القلعان وأشجار المانجروف في مرسى علم',
          description: 'رحلة طبيعية خلابة إلى محمية وادي الجمال الوطنية وشاطئ القلعان الساحر بأشجار المانجروف الأسطورية. استمتع بالسباحة في مياه نقية وتجربة القهوة الجبنة البدوية وغداء طازج في قلب المحمية.',
          highlights: ['استكشاف محمية وادي الجمال الطبيعية الخلابة', 'شاطئ القلعان الساحر وشجرة المانجروف الشهيرة في المياه الفيروزية', 'غداء بدوي وتجربة طقوس القهوة الجبنة الأصيلة'],
          inclusions: ['الانتقالات من وإلى الفندق', 'رسوم دخول محمية وادي الجمال', 'أدوات السنوركلينج والغداء والمشروبات'],
          exclusions: ['المشتريات الشخصية'],
          whatToBring: 'ملابس سباحة، فوطة، حذاء مريح، نظارة شمس.',
        },
      },
    },
    {
      slug: 'elphinstone-reef-scuba-diving-expedition',
      category: 'Sea',
      basePriceUSD: 85,
      adultPrice: 85,
      originalPrice: 120,
      childPrice: null,
      infantPrice: null,
      durationHours: 8,
      duration: '8 Hours',
      durationDisplay: '8 Hours (Advanced Diving Expedition)',
      maxCapacity: 20,
      coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
      ],
      isFeatured: false,
      isRecommended: true,
      ratingAverage: 5.0,
      ratingCount: 27,
      status: 'ACTIVE',
      vehicleType: 'Minivan / Speedboat Transfer',
      boatType: 'Zodiac / Specialized Dive Yacht',
      freeCancellationHours: 24,
      instantConfirmation: true,
      pickupType: 'hotel',
      pickupTimes: ['07:30'],
      translations: {
        en: {
          title: 'Elphinstone Reef Scuba Diving Expedition (Certified Divers)',
          description: 'One of the legendary offshore dive sites in the world. Elphinstone Reef features sheer vertical walls plunging over 100 meters, dramatic drop-offs, massive gorgonians, and frequent encounters with pelagic marine life, oceanic whitetip sharks, and barracudas.',
          highlights: [
            '2 guided deep wall dives at the world-renowned Elphinstone Reef',
            'Spectacular drift dives along northern and southern plateaus',
            'Encounters with pelagic fish, oceanic whitetips, hammerheads, and reef sharks',
            'High-speed Zodiac boat transfer for direct reef access',
          ],
          inclusions: ['Round-trip transfers from hotel', '2 guided dives with certified divemaster', 'Tanks and weights', 'Lunch buffet and refreshments on boat'],
          exclusions: ['Full scuba gear rental (available if needed)', 'National marine park fees ($10)'],
          whatToBring: 'Diver certification card (Advanced Open Water min. 30 logged dives), logbook, dive computer, swimwear.',
        },
        ar: {
          title: 'رحلة غطس شعاب إلفينستون الأسطورية للمحترفين (Elphinstone Reef)',
          description: 'واحدة من أشهر وأقوى مناطق الغطس في العالم. جدران مرجانية عمودية تنحدر لأكثر من 100 متر في الأعماق، وتيارات غنية بالأسماك الكبيرة، وأسماك القرش المحيطية في تجربة غطس فريدة للغواصين المعتمدين.',
          highlights: ['غطستان موجهتان على جدران شعاب إلفينستون العالمية', 'مشاهدة أسماك القرش والأسماك المحيطية الكبيرة', 'الانتقال بالزودياك السريع للوصول المباشر للريف'],
          inclusions: ['الانتقالات من وإلى الفندق', 'الغطسات مع مرشد غطس محترف', 'الأسطوانات والأوزان والغداء على المركب'],
          exclusions: ['تأجير المعدات الكاملة', 'رسوم المحمية البحرية'],
          whatToBring: 'كارنيه الغطس (أدفانسد كحد أدنى)، اللوج بوك، كمبيوتر الغطس.',
        },
      },
    },
  ];

  for (const t of toursToSeed) {
    const existing = await prisma.tour.findUnique({
      where: { slug: t.slug },
    });

    const tourData = {
      slug: t.slug,
      type: 'SHARED',
      category: t.category,
      basePriceUSD: t.basePriceUSD,
      basePrice: t.basePriceUSD,
      adultPrice: t.adultPrice,
      priceAdult: t.adultPrice,
      originalPrice: t.originalPrice,
      childPrice: t.childPrice,
      priceChild: t.childPrice,
      childMinAge: 4,
      childMaxAge: 11,
      infantPrice: t.infantPrice,
      infantMinAge: 0,
      infantMaxAge: 3,
      durationHours: t.durationHours,
      duration: t.duration,
      durationDisplay: t.durationDisplay,
      maxCapacity: t.maxCapacity,
      zoneId: primaryZoneId,
      destinationId: dest.id,
      countryCode: 'EG',
      region: 'Red Sea Governorate',
      city: 'Marsa Alam',
      latitude: 25.0676,
      longitude: 34.8790,
      timezone: 'Africa/Cairo',
      coverImage: t.coverImage,
      galleryImages: t.galleryImages,
      images: t.galleryImages,
      thumbnailUrl: t.coverImage,
      isFeatured: t.isFeatured ?? false,
      isBestSeller: t.isBestSeller ?? false,
      isRecommended: t.isRecommended ?? false,
      isVip: t.isVip ?? false,
      isFamilyFriendly: t.isFamilyFriendly ?? false,
      isNew: true,
      ratingAverage: t.ratingAverage,
      ratingCount: t.ratingCount,
      allowDeposit: true,
      depositPercentage: 20,
      depositType: 'PERCENTAGE',
      allowPayAtLocation: true,
      showExcerptOnCard: true,
      status: t.status,
      hotelPickupIncluded: true,
      pickupType: t.pickupType,
      pickupTimes: t.pickupTimes,
      vehicleType: t.vehicleType,
      boatType: t.boatType,
      freeCancellationHours: t.freeCancellationHours,
      instantConfirmation: t.instantConfirmation,
      translations: t.translations,
      highlights: t.translations.en?.highlights || [],
      inclusions: t.translations.en?.inclusions || [],
      exclusions: t.translations.en?.exclusions || [],
      whatToBring: t.translations.en?.whatToBring || '',
      cancellationPolicy: 'Free cancellation up to 24 hours before experience start time.',
    };

    if (existing) {
      await prisma.tour.update({
        where: { id: existing.id },
        data: tourData,
      });
      console.log(`Updated tour: ${t.slug}`);
    } else {
      await prisma.tour.create({
        data: tourData,
      });
      console.log(`Created tour: ${t.slug}`);
    }
  }

  console.log('--- Marsa Alam tours successfully seeded! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
