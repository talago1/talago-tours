const path = require('path');
const { execSync } = require('child_process');

const prismaBin = path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js');

try {
  console.log('Pushing schema to database...');
  execSync(`node "${prismaBin}" db push --accept-data-loss`, { stdio: 'inherit', env: process.env });
  console.log('Generating client...');
  execSync(`node "${prismaBin}" generate`, { stdio: 'inherit', env: process.env });
  console.log('SUCCESS: Prisma database and client updated!');
} catch (e) {
  console.error('Prisma sync failed:', e.message);
  process.exit(1);
}