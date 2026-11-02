const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const models = [
  'promoCode',
  'destination',
  'zone',
  'tour',
  'booking',
  'review',
  'transaction',
  'customerProfile',
  'tourTimeSlot',
  'notificationLog',
  'systemSetting',
  'mediaAsset',
  'newsletterSubscription',
  'crewMember',
  'fleetAsset',
  'crewAssignment',
  'fleetAssignment',
  'tripExpense',
  'blogPost',
  'abandonedCheckout',
  'tourRedirect',
  'bookingLead',
  'liveChatConversation',
  'liveChatMessage',
  'tourAvailability',
  'tourScheduleRule'
];

async function backup() {
  console.log('--- STARTING COMPLETE DATABASE BACKUP (ALL 26 MODELS) ---');
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `db_backup_pre_hard_deletion_${timestamp}.json`);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      counts: {}
    },
    tables: {}
  };

  for (const modelName of models) {
    if (!prisma[modelName]) {
      console.warn(`Model ${modelName} not found on prisma client`);
      continue;
    }
    try {
      const records = await prisma[modelName].findMany();
      backupData.tables[modelName] = records;
      backupData.metadata.counts[modelName] = records.length;
      console.log(`[BACKUP] ${modelName}: ${records.length} records`);
    } catch (err) {
      console.error(`Error dumping ${modelName}:`, err.message);
      throw err;
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  const stats = fs.statSync(backupFile);
  console.log('--- DATABASE BACKUP COMPLETE ---');
  console.log('Saved to:', backupFile);
  console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('Summary counts:', backupData.metadata.counts);
}

backup()
  .catch((err) => {
    console.error('Backup failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
