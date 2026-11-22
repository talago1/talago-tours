const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Sample Bookings ---');
  const sampleBookings = await prisma.booking.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      bookingReference: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      createdAt: true,
      tourId: true,
      paymentStatus: true,
      totalPriceUSD: true,
      tour: { select: { slug: true } },
    },
  });
  console.log(JSON.stringify(sampleBookings, null, 2));

  console.log('--- Booking breakdown by status ---');
  const bookingStatus = await prisma.booking.groupBy({
    by: ['status', 'paymentStatus'],
    _count: { _all: true },
  });
  console.log(JSON.stringify(bookingStatus, null, 2));

  console.log('--- Customer Profiles ---');
  const profiles = await prisma.customerProfile.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      telegramPhoneVerified: true,
      createdAt: true,
    },
  });
  console.log(JSON.stringify(profiles, null, 2));

  console.log('--- Booking Leads ---');
  const leads = await prisma.bookingLead.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      createdAt: true,
      tourId: true,
      tourSlug: true,
    },
  });
  console.log(JSON.stringify(leads, null, 2));

  console.log('--- LiveChat Conversations & Messages ---');
  const convCount = await prisma.liveChatConversation.count();
  const msgCount = await prisma.liveChatMessage.count();
  console.log({ convCount, msgCount });

  const unreadVisitorMsgs = await prisma.liveChatMessage.count({
    where: { senderType: 'VISITOR', isRead: false },
  });
  console.log({ unreadVisitorMsgs });

  console.log('--- Notification Logs ---');
  const notifLogs = await prisma.notificationLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      recipient: true,
      status: true,
      createdAt: true,
      bookingId: true,
    },
  });
  console.log(JSON.stringify(notifLogs, null, 2));

  console.log('--- Tours in DB ---');
  const allTours = await prisma.tour.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      category: true,
      destinationId: true,
      destination: { select: { name: true, slug: true } },
      bookingQuestions: true,
      hotelPickupIncluded: true,
      pickupType: true,
    },
  });
  console.log(JSON.stringify(allTours, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
