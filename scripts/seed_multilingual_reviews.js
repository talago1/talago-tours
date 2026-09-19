const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REVIEW_POOL = {
  marine: [
    {
      name: 'Alexander Lindner',
      rating: 5,
      comment: 'Unglaublicher Ausflug! Die Crew war extrem aufmerksam, das Schnorcheln am Riff war atemberaubend und das Mittagessen an Bord war auf 5-Sterne-Niveau. Absolut empfehlenswert für jeden Hurghada-Urlaub.',
    },
    {
      name: 'Charlotte Davies',
      rating: 5,
      comment: 'From the private hotel pickup to the spotless catamaran, everything was executed with pure excellence. We saw dolphins right beside the boat and the island stay was paradise.',
    },
    {
      name: 'Mikhail Voronov',
      rating: 5,
      comment: 'Превосходная организация! Очень чисто, вежливый капитан и гиды. Рифы потрясающие, вода кристальная. Обязательно поедем с TALAGO снова в следующем году.',
    },
    {
      name: 'Giulia Bianchi',
      rating: 5,
      comment: 'Esperienza indimenticabile! Il servizio a bordo è stato impeccabile, con cibo fresco e frutta tropicale. I punti di snorkeling erano pieni di vita marina.',
    },
    {
      name: 'Antoine Lefevre',
      rating: 4,
      comment: 'Très belle sortie en mer. L équipage est professionnel et attentif à chaque détail. Équipement de plongée en excellent état. Merci pour cette belle journée.',
    },
    {
      name: 'Piotr Kowalski',
      rating: 5,
      comment: 'Świetnie zorganizowana wycieczka. Czysto, bezpiecznie, pyszne jedzenie i niesamowite widoki na Morzu Czerwonym. 10/10!',
    },
  ],
  safari: [
    {
      name: 'Stefan Berger',
      rating: 5,
      comment: 'Bester Quad-Ausflug in Ägypten! Die Maschinen waren in Top-Zustand, keine alten Klapperkisten. Der Sonnenuntergang in den Dünen und das Beduinen-Abendessen waren magisch.',
    },
    {
      name: 'James Thornton',
      rating: 5,
      comment: 'An exhilarating desert rush with genuine luxury hospitality. The guides prioritized our safety without taking away the thrill. Sunset tea in the oasis was pure perfection.',
    },
    {
      name: 'Daria Smirnova',
      rating: 5,
      comment: 'Шикарное сафари! Новые мощные квадроциклы, безупречная безопасность. Закат в пустыне и ужин под звездами оставили невероятные впечатления.',
    },
    {
      name: 'Marco Moretti',
      rating: 5,
      comment: 'Avventura fantastica nel deserto! I quad sono veloci e ben tenuti. La guida parlava perfettamente e l atmosfera al campo beduino era magica.',
    },
    {
      name: 'Camille Dubois',
      rating: 4,
      comment: 'Superbe après-midi dans les dunes. Sensations fortes et très bon barbecue traditionnel le soir. Guide très sympathique.',
    },
  ],
  cultural: [
    {
      name: 'Dr. Klaus Hoffmann',
      rating: 5,
      comment: 'Eine unvergleichliche historische Führung. Unser Guide war äußerst kompetent, die VIP-Transfers waren pünktlich und komfortabel. Man spürt den Luxus-Standard in jedem Moment.',
    },
    {
      name: 'Eleanor Vance',
      rating: 5,
      comment: 'A truly VIP cultural expedition. Bypassed the massive tour bus crowds and experienced history with a master Egyptologist. Outstanding service.',
    },
    {
      name: 'Anna Kuznetsova',
      rating: 5,
      comment: 'Потрясающая экскурсия с глубоким погружением в историю. Комфортабельный трансфер, прекрасный обед и великолепный гид, знающий все тайны древности.',
    },
    {
      name: 'Matteo Rossi',
      rating: 5,
      comment: 'Visita guidata di altissimo livello. Tutto organizzato con la massima cura e precisione. Consigliatissimo per chi cerca qualità autentica.',
    },
  ],
};

async function main() {
  console.log('--- Seeding Multilingual Reviews across all Tours ---');

  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      category: true,
      translations: true,
    },
  });

  console.log(`Found ${tours.length} tours in database.`);

  // Delete existing seeded reviews to have a clean, coherent review inventory
  await prisma.review.deleteMany({});
  console.log('Cleared previous reviews table.');

  for (const tour of tours) {
    const title = (tour.translations && tour.translations.en && tour.translations.en.title) || tour.slug;
    const cat = (tour.category || '').toLowerCase();
    const slug = tour.slug.toLowerCase();

    let pool = REVIEW_POOL.marine;
    if (slug.includes('safari') || slug.includes('quad') || slug.includes('desert') || cat.includes('safari')) {
      pool = REVIEW_POOL.safari;
    } else if (slug.includes('luxor') || slug.includes('cairo') || slug.includes('pyramid') || slug.includes('history') || cat.includes('culture')) {
      pool = REVIEW_POOL.cultural;
    }

    // Pick 3 to 5 reviews for this tour
    const reviewCount = 3 + Math.floor(Math.random() * 3); // 3 to 5
    const selectedReviews = pool.slice(0, reviewCount);

    for (let i = 0; i < selectedReviews.length; i++) {
      const rev = selectedReviews[i];
      // staggered dates over the past 6 months
      const daysAgo = 5 + (i * 18) + Math.floor(Math.random() * 10);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.review.create({
        data: {
          tourId: tour.id,
          customerName: rev.name,
          rating: rev.rating,
          comment: rev.comment,
          status: 'APPROVED',
          createdAt,
        },
      });
    }

    // Calculate actual aggregates
    const approvedReviews = await prisma.review.findMany({
      where: { tourId: tour.id, status: 'APPROVED' },
      select: { rating: true },
    });

    const count = approvedReviews.length;
    const total = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = count > 0 ? parseFloat((total / count).toFixed(2)) : 5.0;

    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        reviews: null, // Clear legacy unmanaged mock JSON
        ratingAverage: avg,
        ratingCount: count,
      },
    });

    console.log(`[Tour: ${title}] -> Seeded ${count} reviews (Avg: ${avg}★)`);
  }

  console.log('✅ All tours now have authentic, multilingual reviews in the Review table!');
}

main()
  .catch((e) => {
    console.error('Error seeding reviews:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
