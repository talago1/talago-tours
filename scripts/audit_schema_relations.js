const fs = require('fs');

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = schema.split('\n');

console.log('=== RELATIONS TO TOUR & DESTINATION ===');
let currentModel = '';
lines.forEach((line, i) => {
  const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
  }
  if (line.includes('Tour') || line.includes('tourId') || line.includes('Destination') || line.includes('destinationId')) {
    console.log(`${currentModel} (line ${i + 1}): ${line.trim()}`);
  }
});
