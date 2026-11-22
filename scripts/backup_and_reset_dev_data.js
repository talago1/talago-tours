const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  console.log('=== PHASE 3: DEVELOPMENT DATA RESET & BACKUP ===');

  // 1. Export backup before deletion
  console.log('1. Exporting development records backup...');
  const [
    bookings, reviews, transactions, customers, leads, chatConvs, chatMsgs, notifs, abandoned
  ] = await Promise.all([
    prisma.booking.findMany(),
    prisma.review.findMany(),
    prisma.transaction.findMany(),
    prisma.customerProfile.findMany(),
    prisma.bookingLead.findMany(),
    prisma.liveChatConversation.findMany(),
    prisma.liveChatMessage.findMany(),
    prisma.notificationLog.findMany(),
    prisma.abandonedCheckout.findMany(),
  ]);

  const backupData = {
    exportedAt: new Date().toISOString(),
    counts: {
      bookings: bookings.length,
      reviews: reviews.length,
      transactions: transactions.length,
      customers: customers.length,
      leads: leads.length,
      chatConvs: chatConvs.length,
      chatMsgs: chatMsgs.length,
      notifs: notifs.length,
      abandoned: abandoned.length,
    },
    data: {
      bookings, reviews, transactions, customers, leads, chatConvs, chatMsgs, notifs, abandoned
    }
  };

  const backupPath = path.join(__dirname, 'dev_data_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`Backup saved to ${backupPath} (Total records: ${Object.values(backupData.counts).reduce((a, b) => a + b, 0)})`);

  // 2. Perform Clean Deletion in Strict Foreign Key Order
  console.log('2. Resetting authorized development tables...');
  const deletedReviews = await prisma.review.deleteMany({});
  console.log('Deleted reviews:', deletedReviews.count);

  const deletedTransactions = await prisma.transaction.deleteMany({});
  console.log('Deleted transactions:', deletedTransactions.count);

  const deletedChatMessages = await prisma.liveChatMessage.deleteMany({});
  console.log('Deleted chat messages:', deletedChatMessages.count);

  const deletedChatConvs = await prisma.liveChatConversation.deleteMany({});
  console.log('Deleted chat conversations:', deletedChatConvs.count);

  const deletedLeads = await prisma.bookingLead.deleteMany({});
  console.log('Deleted booking leads:', deletedLeads.count);

  const deletedAbandoned = await prisma.abandonedCheckout.deleteMany({});
  console.log('Deleted abandoned checkouts:', deletedAbandoned.count);

  const deletedBookings = await prisma.booking.deleteMany({});
  console.log('Deleted bookings:', deletedBookings.count);

  const deletedNotifs = await prisma.notificationLog.deleteMany({});
  console.log('Deleted notification logs:', deletedNotifs.count);

  const deletedTicketsAndPkce = await prisma.systemSetting.deleteMany({
    where: {
      OR: [
        { key: { startsWith: 'auth_ticket' } },
        { key: { startsWith: 'tg_' } },
      ],
    },
  });
  console.log('Deleted transient auth tickets and tg_pkce rows:', deletedTicketsAndPkce.count);

  const deletedCustomers = await prisma.customerProfile.deleteMany({});
  console.log('Deleted customer profiles:', deletedCustomers.count);

  // 3. Purge test identities in Supabase Auth
  console.log('3. Purging test identities from Supabase Auth...');
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
  if (!listError && usersData?.users) {
    let deletedAuthCount = 0;
    for (const u of usersData.users) {
      // Delete test users (telegram-*, guest-*, test-*)
      if (
        u.email?.startsWith('telegram-') ||
        u.email?.startsWith('guest-') ||
        u.email?.startsWith('test-')
      ) {
        await supabaseAdmin.auth.admin.deleteUser(u.id).catch(() => {});
        deletedAuthCount++;
      }
    }
    console.log('Deleted Supabase test auth identities:', deletedAuthCount);
  }

  // 4. Verify preserved catalog and product tables
  console.log('4. Verifying preserved catalog and configuration tables...');
  const tourCount = await prisma.tour.count();
  const destinationCount = await prisma.destination.count();
  const mediaCount = await prisma.mediaAsset.count();
  const settingsCount = await prisma.systemSetting.count();

  console.log('PRESERVED PRODUCT ASSETS:');
  console.log({
    tours: tourCount,
    destinations: destinationCount,
    mediaAssets: mediaCount,
    systemSettings: settingsCount,
  });

  console.log('=== DEVELOPMENT DATA RESET COMPLETE ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
