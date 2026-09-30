const { execSync } = require('child_process');
try {
  console.log('Running prisma db push...');
  execSync('npx.cmd prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('Running prisma generate...');
  execSync('npx.cmd prisma generate', { stdio: 'inherit' });
  console.log('Schema synchronized and Prisma Client regenerated successfully!');
} catch (e) {
  console.error('Error executing prisma commands:', e.message);
  process.exit(1);
}