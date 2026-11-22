const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function run() {
  const [
    bookings, reviews, transactions, customers, leads, chatConvs, chatMsgs, notifs, abandoned, tickets, pkces
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.review.count(),
    prisma.transaction.count(),
    prisma.customerProfile.count(),
    prisma.bookingLead.count(),
    prisma.liveChatConversation.count(),
    prisma.liveChatMessage.count(),
    prisma.notificationLog.count(),
    prisma.abandonedCheckout.count(),
    prisma.systemSetting.count({ where: { key: { startsWith: 'auth_ticket' } } }),
    prisma.systemSetting.count({ where: { key: { startsWith: 'tg_' } } })
  ]);
  console.log('DEV_RECORDS:', {
    bookings, reviews, transactions, customers, leads, chatConvs, chatMsgs, notifs, abandoned, tickets, pkces
  });
  const tours = await prisma.tour.count();
  const destinations = await prisma.destination.count();
  console.log('PRODUCT_RECORDS_PRESERVED:', { tours, destinations });
}
run().finally(() => prisma.$disconnect());
