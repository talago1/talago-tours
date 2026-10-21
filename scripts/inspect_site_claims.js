const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const settings = await prisma.systemSetting.findMany();
  console.log('=== SYSTEM SETTINGS IN DB ===');
  settings.forEach(s => {
    console.log(`Key: "${s.key}"`);
    console.log(`Value:`, JSON.parse(s.value));
  });

  const reviews = await prisma.review.findMany();
  console.log(`\n=== REAL REVIEWS IN DB: ${reviews.length} ===`);
  const ratings = reviews.map(r => r.rating);
  const avg = ratings.reduce((a, b) => a + b, 0) / (ratings.length || 1);
  console.log('Average real review rating across DB:', avg.toFixed(2));
  console.log('Sample reviews:', reviews.slice(0, 3));
}

run().finally(() => prisma.$disconnect());
