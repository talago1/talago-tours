const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.blogPost.count();
    console.log('BlogPost model is working! Current count:', count);
  } catch (err) {
    console.error('BlogPost query error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();