const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- EXECUTING QUICK DATABASE FIXES ---');

  // 1. ISS-05: Fix inverted price on diving-trip-red-sea-hurghada
  const divingTour = await prisma.tour.findUnique({
    where: { slug: 'diving-trip-red-sea-hurghada' }
  });
  if (divingTour) {
    await prisma.tour.update({
      where: { id: divingTour.id },
      data: { originalPrice: 35 }
    });
    console.log('ISS-05 fixed: diving-trip-red-sea-hurghada originalPrice updated from', divingTour.originalPrice, 'to 35');
  }

  // 2. Fix basePriceUSD mismatch on cairo-pyramids-grand-egyptian-museum-marsa-alam
  const marsaCairoTour = await prisma.tour.findUnique({
    where: { slug: 'cairo-pyramids-grand-egyptian-museum-marsa-alam' }
  });
  if (marsaCairoTour && marsaCairoTour.basePriceUSD !== marsaCairoTour.adultPrice) {
    await prisma.tour.update({
      where: { id: marsaCairoTour.id },
      data: { basePriceUSD: marsaCairoTour.adultPrice, basePrice: marsaCairoTour.adultPrice }
    });
    console.log('Fixed basePriceUSD mismatch on cairo-pyramids-grand-egyptian-museum-marsa-alam from', marsaCairoTour.basePriceUSD, 'to', marsaCairoTour.adultPrice);
  }

  // 3. ISS-07: Hide empty destinations from active display
  const safaga = await prisma.destination.findUnique({ where: { slug: 'safaga' } });
  if (safaga && safaga.isVisible) {
    await prisma.destination.update({
      where: { id: safaga.id },
      data: { isVisible: false }
    });
    console.log('ISS-07 fixed: safaga destination isVisible set to false (0 tours)');
  }

  // 4. ISS-08 & ISS-12: Clean system_settings "banners"
  const bannerSetting = await prisma.systemSetting.findUnique({ where: { key: 'banners' } });
  if (bannerSetting) {
    let banners = JSON.parse(bannerSetting.value);

    // Strip http://localhost:3000
    ['toursCatalogBackground', 'destinationsBackground', 'bookingCheckoutBackground'].forEach(k => {
      if (banners[k] && typeof banners[k] === 'string' && banners[k].includes('http://localhost:3000')) {
        banners[k] = banners[k].replace('http://localhost:3000', '');
        console.log(`ISS-08 fixed: stripped localhost from banners.${k}`);
      }
    });

    // Update Wikipedia description for conciergePickDescription
    if (banners.conciergePickDescription && banners.conciergePickDescription.includes('national archaeological museum')) {
      banners.conciergePickDescription = 'Experience the treasures of King Tutankhamun and the Giza Plateau on an exclusive VIP journey with a private licensed Egyptologist.';
      console.log('ISS-12 fixed: updated conciergePickDescription with luxury tour copy');
    }

    await prisma.systemSetting.update({
      where: { key: 'banners' },
      data: { value: JSON.stringify(banners) }
    });
  }

  console.log('--- QUICK DATABASE FIXES COMPLETED SUCCESSFULLY ---');
}

run()
  .catch((err) => {
    console.error('Quick fixes failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
