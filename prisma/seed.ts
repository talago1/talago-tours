import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingZones = await prisma.zone.findMany();
  if (existingZones.length === 0) {
    await prisma.zone.createMany({
      data: [
        { name: 'Hurghada' },
        { name: 'El Gouna' },
        { name: 'Makadi Bay' },
        { name: 'Sahl Hasheesh' },
        { name: 'Soma Bay' },
        { name: 'Safaga' },
        { name: 'Marsa Alam' },
        { name: 'Quseir' },
      ],
    });
    console.log('Seeded 8 zones');
  } else {
    console.log(`Found ${existingZones.length} zones, skipping zone seed`);
  }

  const existingBookings = await prisma.booking.count();
  if (existingBookings === 0) {
    const tour = await prisma.tour.findFirst();
    if (!tour) {
      console.log('No tours found, skipping booking seed data');
      return;
    }

    const zone = await prisma.zone.findFirst();
    if (!zone) {
      console.log('No zones found, skipping booking seed data');
      return;
    }

    const bookings = [
      {
        bookingReference: 'TLG-20260530-0001',
        tourId: tour.id,
        zoneId: zone.id,
        hotelName: 'Steigenberger Al Dau Beach Hotel',
        travelDate: new Date('2026-06-15'),
        guestCount: 2,
        totalPriceUSD: 140.00,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '201234567890',
        language: 'en',
        status: 'PENDING' as const,
      },
      {
        bookingReference: 'TLG-20260530-0002',
        tourId: tour.id,
        zoneId: zone.id,
        hotelName: 'Mövenpick Resort El Gouna',
        travelDate: new Date('2026-06-20'),
        guestCount: 4,
        totalPriceUSD: 320.00,
        customerName: 'Anna Schmidt',
        customerEmail: 'anna@example.com',
        customerPhone: '491701234567',
        language: 'de',
        status: 'CONFIRMED' as const,
      },
      {
        bookingReference: 'TLG-20260530-0003',
        tourId: tour.id,
        zoneId: zone.id,
        hotelName: 'Iberotel Makadi Beach',
        travelDate: new Date('2026-06-10'),
        guestCount: 1,
        totalPriceUSD: 70.00,
        customerName: 'Ivan Petrov',
        customerEmail: 'ivan@example.com',
        customerPhone: '79161234567',
        language: 'ru',
        status: 'COMPLETED' as const,
      },
      {
        bookingReference: 'TLG-20260530-0004',
        tourId: tour.id,
        zoneId: zone.id,
        hotelName: 'Pickalbatros Jungle Aqua Park',
        travelDate: new Date('2026-06-25'),
        guestCount: 3,
        totalPriceUSD: 210.00,
        customerName: 'Pierre Dubois',
        customerEmail: 'pierre@example.com',
        customerPhone: '',
        language: 'fr',
        status: 'PENDING' as const,
      },
      {
        bookingReference: 'TLG-20260530-0005',
        tourId: tour.id,
        zoneId: zone.id,
        hotelName: 'Titanic Palace',
        travelDate: new Date('2026-06-05'),
        guestCount: 2,
        totalPriceUSD: 160.00,
        customerName: 'Marco Rossi',
        customerEmail: 'marco@example.com',
        customerPhone: '393331234567',
        language: 'it',
        status: 'CANCELLED' as const,
      },
    ];

    await prisma.booking.createMany({ data: bookings });
    console.log(`Seeded ${bookings.length} test bookings`);
  } else {
    console.log(`Found ${existingBookings} bookings, skipping booking seed`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
