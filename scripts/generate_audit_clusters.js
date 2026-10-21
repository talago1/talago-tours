const fs = require('fs');
const tours = JSON.parse(fs.readFileSync('scripts/audit_tours_dump.json', 'utf8'));

// Define the cluster definitions
const clusters = [
  {
    name: 'Cairo & Pyramids Day Trip (The Egyptian Wonders)',
    masterTitle: 'Cairo, Giza Pyramids & Egyptian Museums Day Trip',
    proposedMasterSlug: 'cairo-pyramids-museum-day-trip',
    destination: 'cairo',
    category: 'Cultural',
    description: 'Comprehensive day tour to Cairo visiting the Great Pyramids of Giza, the Great Sphinx, and world-renowned museum galleries, with options for transport type, museum selection, and departure city.',
    slugs: [
      'cairo-pyramids-day-trip-from-hurghada',
      'cairo-pyramids-grand-egyptian-museum',
      'cairo-gem-pyramids-day-trip',
      'cairo-tahrir-museum-pyramids',
      'cairo-grand-egyptian-museum-from-sharm',
      'cairo-pyramids-day-trip-from-sharm',
      'cairo-pyramids-grand-egyptian-museum-marsa-alam',
      'cairo-pyramids-of-giza-sphinx-museum-day-tour',
      'cairo-pyramids-by-plane',
      'grand-egyptian-museum-super-tour'
    ]
  },
  {
    name: 'Luxor Highlights & Ancient Thebes Day Trip',
    masterTitle: 'Luxor Highlights Day Trip: Valley of the Kings, Karnak & Hatshepsut',
    proposedMasterSlug: 'luxor-valley-of-the-kings-karnak-day-trip',
    destination: 'luxor',
    category: 'Cultural',
    description: 'Iconic ancient Egyptian day journey visiting Karnak Temple, Valley of the Kings, Temple of Hatshepsut, and Colossi of Memnon with multi-city departures, group tiers, and temple options.',
    slugs: [
      'luxor-day-trip-from-hurghada',
      'luxor-mini-group-tour',
      'luxor-mini-group-valley-kings',
      'luxor-valley-kings-day-trip',
      'luxor-valley-queens-day-trip',
      'luxor-valley-of-kings-from-marsa-alam',
      'luxor-valley-of-the-kings-karnak-day-trip',
      'luxor-dendera-super-tour'
    ]
  },
  {
    name: 'Sataya Dolphin Reef Snorkeling Expedition (Marsa Alam)',
    masterTitle: 'Sataya Dolphin Reef Yacht Expedition & Wild Dolphin Swim',
    proposedMasterSlug: 'sataya-dolphin-reef-marsa-alam',
    destination: 'marsa-alam',
    category: 'Sea',
    description: 'Full-day marine yacht expedition to the famous Sataya Reef (Dolphin House) in the Red Sea Marine Reserve to swim alongside wild spinner dolphins.',
    slugs: [
      'sataya-dolphin-reef-marsa-alam',
      'sataya-dolphin-reef-marsa-alam-luxury-cruise'
    ]
  },
  {
    name: 'Hurghada Red Sea Desert Safari (Quad, Buggy & Bedouin Experience)',
    masterTitle: 'Hurghada Desert Safari: ATV Quad, Buggy, Camel & Bedouin Oasis',
    proposedMasterSlug: 'hurghada-desert-quad-safari-experience',
    destination: 'hurghada',
    category: 'Safari',
    description: 'Action-packed Arabian desert safari in Hurghada offering flexible tiers from 3-hour morning ATV quad rides to 6-hour mega evening safaris with BBQ dinner and stargazing.',
    slugs: [
      'desert-safari-3h-atv',
      'hurghada-moto-safari-quad-bikes',
      'desert-safari-3h-dinner-show',
      'family-safari-hurghada',
      'hurghada-desert-super-safari-quad-bedouin',
      'hurghada-mega-safari-quad-buggy-bedouin-dinner',
      'royal-safari-hurghada',
      'super-safari-hurghada',
      'star-gazing-safari-hurghada'
    ]
  },
  {
    name: 'Giftun Island & Orange Bay / Paradise Beach Cruises (Hurghada)',
    masterTitle: 'Giftun Island National Park: Orange Bay, Paradise Island & Snorkeling Cruise',
    proposedMasterSlug: 'giftun-island-orange-bay-cruise',
    destination: 'hurghada',
    category: 'Sea',
    description: 'Premier Red Sea island boat trip to Giftun Island National Park with options for Orange Bay, Paradise Island beach club, sunset cruises, or private speedboat charters.',
    slugs: [
      'orange-bay-giftun-island-day',
      'giftun-island-orange-bay-luxury-cruise',
      'orange-bay-island-hurghada',
      'orange-bay-sunset-cruise',
      'hula-hula-paradise-island-hurghada'
    ]
  },
  {
    name: 'Ras Mohamed National Park & White Island (Sharm El Sheikh)',
    masterTitle: 'Ras Mohamed National Park & White Island Yacht Cruise',
    proposedMasterSlug: 'ras-mohamed-white-island-yacht-cruise',
    destination: 'sharm-el-sheikh',
    category: 'Sea',
    description: 'World-renowned marine park excursion from Sharm El Sheikh featuring vibrant coral reefs, the disappearing sandbank of White Island, and optional scuba diving.',
    slugs: [
      'ras-mohamed-white-island-luxury-cruise',
      'ras-mohamed-white-island-luxury-yacht-sharm',
      'scuba-diving-white-island-ras-mohamed',
      'ras-mohamed-national-park-bus-tour'
    ]
  },
  {
    name: 'Mount Sinai & St. Catherine Monastery Sunrise Trek',
    masterTitle: 'Mount Sinai (Mount Moses) Sunrise Trek & St. Catherine Monastery',
    proposedMasterSlug: 'mount-sinai-st-catherine-sunrise-trek',
    destination: 'sharm-el-sheikh',
    category: 'Cultural',
    description: 'Spiritual overnight pilgrimage to climb Mount Sinai for sunrise over the rugged desert peaks, followed by a guided tour of the 6th-century UNESCO World Heritage St. Catherine Monastery.',
    slugs: [
      'mount-moses-st-catherine-sunrise-hike',
      'mount-sinai-sunrise-st-catherine-monastery-tour'
    ]
  },
  {
    name: 'Abu Dabbab Bay Green Sea Turtle & Dugong Snorkeling (Marsa Alam)',
    masterTitle: 'Abu Dabbab Bay Snorkeling: Giant Green Sea Turtles & Dugong Sanctuary',
    proposedMasterSlug: 'abu-dabbab-sea-turtles-dugong-snorkeling',
    destination: 'marsa-alam',
    category: 'Sea',
    description: 'Protected shallow coastal bay in Marsa Alam famous for resident giant green sea turtles and grazing dugongs (sea cows).',
    slugs: [
      'abu-dabbab-bay-turtles-dugong-snorkeling',
      'abu-dabbab-sea-turtle-dugong-bay-snorkeling'
    ]
  },
  {
    name: 'Hurghada Luxury Turkish Bath & Spa Wellness Rituals',
    masterTitle: 'Hurghada Traditional Hammam & Luxury Spa Rituals',
    proposedMasterSlug: 'hurghada-luxury-hammam-spa-rituals',
    destination: 'hurghada',
    category: 'Spa',
    description: 'Rejuvenating Oriental wellness experience with authentic sauna, steam room, peeling scrubs, foam massage, and Cleopatra or Moroccan rituals.',
    slugs: [
      'spa-body-massage-1h-hurghada',
      'spa-turkish-bath-massage-hurghada',
      'spa-cleopatra-bath-massage-hurghada',
      'spa-moroccan-bath-massage-hurghada'
    ]
  },
  {
    name: 'Hurghada Dolphinarium & Marine Park Encounters',
    masterTitle: 'Hurghada Dolphin World: Show, Photo Session & Dolphin Swimming',
    proposedMasterSlug: 'hurghada-dolphin-world-encounters',
    destination: 'hurghada',
    category: 'Sea',
    description: 'Family-friendly dolphinarium experience at Dolphin World Hurghada with options for spectator show admission, close-up photo sessions, or interactive dolphin swimming.',
    slugs: [
      'dolphinarium-show-hurghada',
      'dolphin-photo-session-hurghada',
      'swim-with-dolphins-10min-hurghada'
    ]
  },
  {
    name: 'Hurghada Guided Scuba Diving for Beginners & Certified',
    masterTitle: 'Red Sea Scuba Diving: Introductory & Certified Guided Dives',
    proposedMasterSlug: 'hurghada-scuba-diving-experience',
    destination: 'hurghada',
    category: 'Sea',
    description: 'Full-day diving boat excursion in Hurghada with professional PADI-certified divemasters, including 2 guided dives, full equipment rental, and lunch on board.',
    slugs: [
      'diving-trip-red-sea-hurghada',
      'hurghada-crystal-bay-diving-intro'
    ]
  },
  {
    name: 'Marsa Alam Semi-Submarine & Underwater Explorers',
    masterTitle: 'Port Ghalib Semi-Submarine & Pharaonic Coral Observatory',
    proposedMasterSlug: 'marsa-alam-semi-submarine-coral-explorer',
    destination: 'marsa-alam',
    category: 'Sea',
    description: 'Sub-surface panoramic observation cruise offering deep underwater views of Red Sea coral reefs and marine fauna without getting wet.',
    slugs: [
      'royal-sea-scope-semi-submarine-marsa-alam',
      'nefertari-pharaonic-sea-experience-marsa-alam'
    ]
  },
  {
    name: 'Sharm El Sheikh Sinai Desert Quad & Super Safari',
    masterTitle: 'Sinai Desert Safari: Quad ATV, Camel Ride & Bedouin Dinner',
    proposedMasterSlug: 'sharm-desert-quad-safari-experience',
    destination: 'sharm-el-sheikh',
    category: 'Safari',
    description: 'Thrilling Sinai desert adventure from Sharm El Sheikh with choices of 3-hour morning quad safari or full evening super safari with Bedouin dinner and oriental show.',
    slugs: [
      'desert-quad-bike-safari-sharm',
      'super-safari-sharm-el-sheikh'
    ]
  }
];

const clusterResults = clusters.map(c => {
  const matchedTours = c.slugs.map(s => {
    const t = tours.find(item => item.slug === s);
    if (!t) return { slug: s, notFound: true };
    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      destination: t.destination,
      zone: t.zone,
      price: t.adultPrice,
      originalPrice: t.originalPrice,
      duration: t.duration || `${t.durationHours}h`,
      durationHours: t.durationHours,
      type: t.type
    };
  });
  return { ...c, tours: matchedTours };
});

fs.writeFileSync('scripts/audit_clusters_detailed.json', JSON.stringify(clusterResults, null, 2));
console.log('Analyzed', clusterResults.length, 'master clusters encompassing', clusterResults.reduce((a, b) => a + b.tours.length, 0), 'tours.');
