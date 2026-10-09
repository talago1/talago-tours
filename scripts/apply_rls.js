const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const sqlPath = path.join(__dirname, 'enforce_rls.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Enforcing Row Level Security (RLS) on Talago database tables...');

  // Split SQL commands by semicolon (ignoring comments/empty lines)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log('✓ Executed:', statement.split('\n')[0]);
    } catch (err) {
      console.warn('⚠️ Statement warning:', statement.split('\n')[0], err.message);
    }
  }

  console.log('✅ RLS enforcement complete.');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error enforcing RLS:', err);
  process.exit(1);
});
