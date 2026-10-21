const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('--- STARTING COMPLETE DATABASE BACKUP ---');
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `db_backup_pre_consolidation_${timestamp}.json`);

  const [
    destinations,
    zones,
    tours,
    bookings,
    reviews,
    transactions,
    promoCodes,
    customerProfiles,
    tourTimeSlots,
    notificationLogs,
    systemSettings,
    mediaAssets,
    newsletterSubscriptions,
    crewMembers,
    fleetAssets,
    crewAssignments,
    fleetAssignments,
    tripExpenses,
    blogPosts,
    abandonedCheckouts
  ] = await Promise.all([
    prisma.destination.findMany(),
    prisma.zone.findMany(),
    prisma.tour.findMany(),
    prisma.booking.findMany(),
    prisma.review.findMany(),
    prisma.transaction.findMany(),
    prisma.promoCode.findMany(),
    prisma.customerProfile.findMany(),
    prisma.tourTimeSlot.findMany(),
    prisma.notificationLog.findMany(),
    prisma.systemSetting.findMany(),
    prisma.mediaAsset.findMany(),
    prisma.newsletterSubscription.findMany(),
    prisma.crewMember.findMany(),
    prisma.fleetAsset.findMany(),
    prisma.crewAssignment.findMany(),
    prisma.fleetAssignment.findMany(),
    prisma.tripExpense.findMany(),
    prisma.blogPost.findMany(),
    prisma.abandonedCheckout.findMany()
  ]);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      counts: {
        destinations: destinations.length,
        zones: zones.length,
        tours: tours.length,
        bookings: bookings.length,
        reviews: reviews.length,
        transactions: transactions.length,
        promoCodes: promoCodes.length,
        customerProfiles: customerProfiles.length,
        tourTimeSlots: tourTimeSlots.length,
        notificationLogs: notificationLogs.length,
        systemSettings: systemSettings.length,
        mediaAssets: mediaAssets.length,
        newsletterSubscriptions: newsletterSubscriptions.length,
        crewMembers: crewMembers.length,
        fleetAssets: fleetAssets.length,
        crewAssignments: crewAssignments.length,
        fleetAssignments: fleetAssignments.length,
        tripExpenses: tripExpenses.length,
        blogPosts: blogPosts.length,
        abandonedCheckouts: abandonedCheckouts.length
      }
    },
    tables: {
      destinations,
      zones,
      tours,
      bookings,
      reviews,
      transactions,
      promoCodes,
      customerProfiles,
      tourTimeSlots,
      notificationLogs,
      systemSettings,
      mediaAssets,
      newsletterSubscriptions,
      crewMembers,
      fleetAssets,
      crewAssignments,
      fleetAssignments,
      tripExpenses,
      blogPosts,
      abandonedCheckouts
    }
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  console.log('--- DATABASE BACKUP COMPLETE ---');
  console.log('Saved to:', backupFile);
  console.log('Summary counts:', backupData.metadata.counts);
}

backup()
  .catch((err) => {
    console.error('Backup failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
