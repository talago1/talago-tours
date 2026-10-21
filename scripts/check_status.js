const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const metrics = await p.systemSetting.findUnique({ where: { key: 'metrics' } });
  console.log('Current metrics setting in DB:', metrics);
  const allSettings = await p.systemSetting.findMany({ select: { key: true } });
  console.log('All setting keys:', allSettings.map(s => s.key));
  await p.$disconnect();
}

main().catch(console.error);
