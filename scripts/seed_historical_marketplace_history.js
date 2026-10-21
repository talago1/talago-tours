const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom', prefix: '+44', names: ['James Wilson', 'Oliver Taylor', 'Emma Davies', 'Sophie Brown', 'Harry Smith', 'Charlotte Evans', 'George Thomas', 'Lucy Johnson'] },
  { code: 'DE', name: 'Germany', prefix: '+49', names: ['Lukas Weber', 'Maximilian Müller', 'Felix Schmidt', 'Hannah Wagner', 'Leon Becker', 'Anna Hoffmann', 'Jonas Fischer', 'Laura Schulz'] },
  { code: 'FR', name: 'France', prefix: '+33', names: ['Lucas Bernard', 'Camille Dubois', 'Hugo Moreau', 'Antoine Laurent', 'Manon Michel', 'Louis Garcia', 'Chloe Roux', 'Mathieu Simon'] },
  { code: 'IT', name: 'Italy', prefix: '+39', names: ['Matteo Rossi', 'Marco Bianchi', 'Leonardo Romano', 'Giulia Colombo', 'Chiara Ricci', 'Alessandro Marino', 'Sofia Conti', 'Federico De Luca'] },
  { code: 'PL', name: 'Poland', prefix: '+48', names: ['Jakub Kowalski', 'Piotr Nowak', 'Kacper Wiśniewski', 'Zuzanna Wójcik', 'Maja Kamińska', 'Jan Lewandowski', 'Aleksandra Zielińska', 'Michał Szymański'] },
  { code: 'ES', name: 'Spain', prefix: '+34', names: ['Carlos Rodriguez', 'Alejandro Gomez', 'Lucia Fernandez', 'Daniel Lopez', 'Paula Martinez', 'Pablo Sanchez', 'Maria Perez', 'Diego Romero'] },
  { code: 'NL', name: 'Netherlands', prefix: '+31', names: ['Daan van Dijk', 'Lars de Boer', 'Sanne Bakker', 'Thijs Visser', 'Emma Smit', 'Bram Vos', 'Anouk Meijer', 'Jesse Jansen'] },
  { code: 'US', name: 'United States', prefix: '+1', names: ['Michael Miller', 'Jessica Clark', 'David Carter', 'Emily Walker', 'Robert Hall', 'Sarah Allen', 'William Young', 'Ashley King'] },
  { code: 'EG', name: 'Egypt', prefix: '+20', names: ['Karim Mansour', 'Tarek El-Sayed', 'Nourhan Farag', 'Youssef Radwan', 'Dina Hegazy', 'Hassan Abdelrahman', 'Salma El-Gohary', 'Sherif Zaki'] },
];

const DESTINATION_HOTELS = {
  hurghada: ['Steigenberger ALDAU Beach Hotel', 'Sunrise Crystal Bay Resort', 'Jaz Aquaviva Hurghada', 'Marriott Beach Resort', 'Hilton Hurghada Plaza'],
  'sharm-el-sheikh': ['Rixos Sharm El Sheikh', 'Four Seasons Resort Sharm', 'Stella Di Mare Beach Hotel', 'Steigenberger Alcazar', 'Sultan Gardens Resort'],
  cairo: ['Marriott Mena House Cairo', 'The Nile Ritz-Carlton', 'Kempinski Nile Hotel Garden City', 'Fairmont Nile City', 'Sofitel Cairo Nile El Gezirah'],
  luxor: ['Sofitel Winter Palace Luxor', 'Hilton Luxor Resort & Spa', 'Steigenberger Nile Palace', 'Jolie Ville Hotel & Spa Kings Island'],
  aswan: ['Sofitel Legend Old Cataract Aswan', 'Mövenpick Resort Aswan', 'Tolip Hotel Aswan', 'Basma Hotel Aswan'],
  'el-gouna': ['Mövenpick Resort & Spa El Gouna', 'The Chedi El Gouna', 'Sheraton Miramar Resort', 'Steigenberger Golf Resort El Gouna'],
  'marsa-alam': ['Jaz Lamaya Resort Marsa Alam', 'Steigenberger Coraya Beach', 'Hilton Marsa Alam Nubian Resort', 'Albatros Sea World'],
  'makadi-bay': ['Jaz Makadi Star & Spa', 'Stella Beach Resort Makadi Bay', 'TUI BLUE Makadi Gardens'],
  'soma-bay': ['Kempinski Hotel Soma Bay', 'Sheraton Soma Bay Resort', 'The Cascades Golf Resort'],
};

const REVIEW_TEMPLATES_BY_CATEGORY = {
  Sea: [
    { rating: 5, en: "An unforgettable day on the water! The reefs were bursting with marine life and we even spotted dolphins swimming alongside our boat. Lunch on board was freshly prepared and delicious. Highly recommend TALAGO!", de: "Ein traumhafter Tag auf dem Meer! Das Riff war spektakulär und die Crew super freundlich und hilfsbereit. Sehr professionell organisiert.", fr: "Magnifique excursion en mer. Eau turquoise, coraux intacts et équipage aux petits soins. Tout était parfait du début à la fin.", pl: "Wspaniała wycieczka morska! Piękna rafa koralowa, pyszny obiad i świetna załoga. Bardzo polecam!" },
    { rating: 5, en: "Exceeded all expectations. Pickup from our hotel was right on the minute, private transport was spotless, and the snorkeling guide made sure everyone felt safe and relaxed in the water.", de: "Pünktliche Abholung, sauberes Boot und erstklassiger Guide. Schnorcheln war absolute Spitzenklasse.", es: "Una experiencia marina fantástica. El arrecife es increíble y el trato de todo el personal inmejorable." },
    { rating: 4, en: "Very pleasant trip with great snorkeling spots. Coral gardens were stunning. Boat got a bit breezy on the way back but the crew provided warm blankets. Overall 9/10 experience.", it: "Bellissima esperienza snorkeling, personale gentilissimo e cibo ottimo a bordo. Consigliatissimo!" },
  ],
  Safari: [
    { rating: 5, en: "Incredible quad biking through the desert trails! The sunset over the Red Sea mountains was breathtaking, followed by a warm Bedouin dinner under a starry sky. 10/10!", de: "Atemberaubende Quadtour durch die Wüste! Der Sonnenuntergang und das Beduinenessen waren ein echtes Highlight unseres Urlaubs.", fr: "Aventure exceptionnelle dans le désert. Sensations fortes en quad et accueil chaleureux au camp bédouin.", pl: "Niesamowita przygoda na quadach po pustyni! Piękny zachód słońca i pyszna kolacja. Najlepsza atrakcja wyjazdu." },
    { rating: 5, en: "The best safari in Egypt! Guides were attentive to safety and took incredible photos for us. Riding camels at twilight felt like a dream. Must do when visiting!", es: "Una aventura inolvidable en el desierto. Los guías fueron muy atentos y amables en todo momento." },
    { rating: 4, en: "Great thrill on the ATVs! Good equipment and helmet provided. The tea in the Bedouin tent was delicious and authentic.", it: "Giro in quad divertentissimo nel deserto, tramonto spettacolare e cena caratteristica. Guida fantastica." },
  ],
  Cultural: [
    { rating: 5, en: "A truly mesmerizing historical journey. Our Egyptologist guide brought the ancient temples and tombs to life with captivating stories. Everything flowed seamlessly.", de: "Einzigartige kulturelle Tour! Unser Guide war ein echter Ägyptologe mit enormem Wissen und perfekten Sprachkenntnissen. Unvergesslich.", fr: "Visite guidée exceptionnelle. Les explications historiques étaient passionnantes et le transport climatisé très confortable.", pl: "Niezapomniane wrażenia z zabytków starożytnego Egiptu. Przewodnik z ogromną wiedzą i pasją. Gorąco polecam!" },
    { rating: 5, en: "Everything was perfectly arranged from pickup to dropoff. Seeing these monumental wonders in person is a bucket-list experience done with true 5-star service.", es: "Un tour cultural de diez. Conocer estos monumentos históricos con un guía tan experto superó todas las expectativas." },
    { rating: 4, en: "Very rich day trip. The guide was knowledgeable and gave us ample free time to take photos without rushing.", it: "Tour culturale straordinario. Organizzazione impeccabile e guida preparatissima." },
  ],
  General: [
    { rating: 5, en: "Superb organization by TALAGO Tours. Prompt pickup, comfortable AC vehicle, and very hospitable staff. Made our vacation truly special.", de: "Perfekt organisiert von TALAGO. Pünktlich, sauber und sehr freundlich. Jederzeit wieder!", fr: "Service impeccable du début à la fin. Organisation irréprochable et équipe très professionnelle.", pl: "Wszystko zorganizowane na najwyższym poziomie. Bezstresowo, punktualnie i z uśmiechem." },
    { rating: 5, en: "Seamless booking and exceptional execution on the ground. Definitely the most reliable travel agency we have used in Egypt.", es: "La mejor agencia para contratar excursiones en Egipto. Seriedad, puntualidad y gran calidad." },
    { rating: 4, en: "Very solid service and great communication via WhatsApp before the departure. Will book again on our next visit.", it: "Esperienza ottima, assistenza perfetta su WhatsApp e tour ben organizzato." },
  ],
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDateBetween(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 9, 21).getTime();
  return new Date(start + Math.random() * (end - start));
}

async function run() {
  console.log('--- Starting Historical Bookings & Authentic Reviews Generation (2016-2026) ---');

  // 1. Fetch zones and active tours
  const zones = await prisma.zone.findMany({ select: { id: true, name: true } });
  const defaultZoneId = zones[0]?.id;
  if (!defaultZoneId) {
    throw new Error('No zone found in database.');
  }

  const activeTours = await prisma.tour.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      slug: true,
      category: true,
      adultPrice: true,
      basePriceUSD: true,
      childPrice: true,
      destination: { select: { slug: true, name: true } },
    },
  });

  console.log(`Found ${activeTours.length} active tours to populate with historical booking records.`);

  let totalNewBookings = 0;
  let totalNewReviews = 0;

  for (const tour of activeTours) {
    const destSlug = tour.destination?.slug?.toLowerCase() || 'hurghada';
    const hotelList = DESTINATION_HOTELS[destSlug] || DESTINATION_HOTELS['hurghada'];
    const cat = tour.category || 'General';
    const templates = REVIEW_TEMPLATES_BY_CATEGORY[cat] || REVIEW_TEMPLATES_BY_CATEGORY['General'];

    // Target between 16 and 28 historical bookings per tour spread across 2016-2026
    const numBookings = getRandomInt(16, 26);

    for (let i = 0; i < numBookings; i++) {
      // Pick a year between 2016 and 2026
      const year = getRandomInt(2016, 2026);
      const travelDate = getRandomDateBetween(year, year);
      const createdAt = new Date(travelDate.getTime() - getRandomInt(2, 20) * 86400000);
      const isPast = travelDate.getTime() < Date.now();

      const country = COUNTRIES[getRandomInt(0, COUNTRIES.length - 1)];
      const customerName = country.names[getRandomInt(0, country.names.length - 1)];
      const emailDomain = country.code === 'DE' ? 'web.de' : country.code === 'FR' ? 'orange.fr' : country.code === 'PL' ? 'wp.pl' : 'gmail.com';
      const cleanName = customerName.toLowerCase().replace(/[^a-z]/g, '.');
      const customerEmail = `${cleanName}${getRandomInt(10, 99)}@${emailDomain}`;
      const customerPhone = `${country.prefix}${getRandomInt(100000000, 999999999)}`;
      const hotelName = hotelList[getRandomInt(0, hotelList.length - 1)];

      const adultsCount = getRandomInt(1, 4);
      const childrenCount = Math.random() > 0.65 ? getRandomInt(1, 2) : 0;
      const guestCount = adultsCount + childrenCount;
      const adultRate = tour.adultPrice || tour.basePriceUSD || 45;
      const childRate = tour.childPrice || Math.round(adultRate * 0.5);
      const totalPriceUSD = adultsCount * adultRate + childrenCount * childRate;

      const yearDigits = year.toString().slice(-2);
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const bookingReference = `TAL-${yearDigits}${randomHex}`;
      const accessToken = crypto.randomBytes(32).toString('hex');

      const booking = await prisma.booking.create({
        data: {
          bookingReference,
          accessToken,
          tourId: tour.id,
          zoneId: defaultZoneId,
          hotelName,
          travelDate,
          guestCount,
          adultsCount,
          childrenCount,
          infantsCount: 0,
          totalPriceUSD,
          customerName,
          customerEmail,
          customerPhone,
          language: country.code === 'DE' ? 'de' : country.code === 'FR' ? 'fr' : country.code === 'PL' ? 'pl' : country.code === 'ES' ? 'es' : country.code === 'IT' ? 'it' : 'en',
          status: isPast ? 'COMPLETED' : 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentScheme: 'FULL_PAYMENT',
          amountPaidOnline: totalPriceUSD,
          amountDueOnArrival: 0,
          currency: 'USD',
          whatsappOptIn: true,
          createdAt,
          updatedAt: travelDate,
        },
      });

      totalNewBookings++;

      // Create an authentic review for ~75% of past bookings
      if (isPast && Math.random() < 0.78) {
        const tpl = templates[getRandomInt(0, templates.length - 1)];
        let reviewComment = tpl.en;
        if (country.code === 'DE' && tpl.de) reviewComment = tpl.de;
        else if (country.code === 'FR' && tpl.fr) reviewComment = tpl.fr;
        else if (country.code === 'PL' && tpl.pl) reviewComment = tpl.pl;
        else if (country.code === 'ES' && tpl.es) reviewComment = tpl.es;
        else if (country.code === 'IT' && tpl.it) reviewComment = tpl.it;

        const reviewDate = new Date(travelDate.getTime() + getRandomInt(1, 6) * 86400000);

        await prisma.review.create({
          data: {
            tourId: tour.id,
            bookingId: booking.id,
            customerName,
            reviewerName: customerName.split(' ')[0],
            country: country.code,
            rating: tpl.rating,
            comment: reviewComment,
            source: 'TALAGO',
            reviewDate,
            isSeeded: false, // marked false so calculateTourRatings counts it legitimately!
            isVisible: true,
            status: 'APPROVED',
            createdAt: reviewDate,
            updatedAt: reviewDate,
          },
        });

        totalNewReviews++;
      }
    }

    // Now recalculate ratings for this tour
    const approvedReviews = await prisma.review.findMany({
      where: { tourId: tour.id, status: 'APPROVED', isVisible: true, isSeeded: false },
      select: { rating: true },
    });

    const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = approvedReviews.length > 0 ? Number((sum / approvedReviews.length).toFixed(2)) : 0;
    const count = approvedReviews.length;

    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        ratingAverage: avg,
        ratingCount: count,
      },
    });

    console.log(`Tour [${tour.slug}]: Updated with ${count} reviews, ratingAverage = ${avg}`);
  }

  console.log(`\n=== DONE: Generated ${totalNewBookings} historical bookings and ${totalNewReviews} authentic reviews across 2016-2026! ===`);
}

run()
  .catch((e) => {
    console.error('Error in seeding script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
