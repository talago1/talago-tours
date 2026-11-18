const fs = require('fs');

const egTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_egyptgate.json', 'utf8')).tours;
const mwTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_marsawaves.json', 'utf8')).tours;
const h4uTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_hurghadaforyou.json', 'utf8')).tours;
const albTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_albatros.json', 'utf8')).tours;

console.log('Source record counts:');
console.log(' - EgyptGate:', egTours.length);
console.log(' - MarsaWaves:', mwTours.length);
console.log(' - HurghadaForYou:', h4uTours.length);
console.log(' - Albatros:', albTours.length);

// Check price, destination, and language distribution
function analyzeSource(name, tours) {
  let hasPrice = 0;
  let hasDesc = 0;
  let hasInclusions = 0;
  let englishTitle = 0;
  const dests = {};

  tours.forEach(t => {
    const title = t.sourceName || t.title || '';
    const isEn = !/[а-яА-ЯёЁ]/.test(title) && !title.toLowerCase().includes('ausflug') && !title.toLowerCase().includes('stadtrundfahrt');
    if (isEn) englishTitle++;

    const price = typeof t.priceFrom === 'object' ? t.priceFrom?.from : Number(t.priceFrom);
    if (price && price > 0) hasPrice++;

    if (t.rawDescription && t.rawDescription.length > 20) hasDesc++;
    if (t.inclusions && t.inclusions.length > 0) hasInclusions++;

    const dest = t.destination || 'Unknown';
    dests[dest] = (dests[dest] || 0) + 1;
  });

  console.log(`\n${name}:`);
  console.log(`  Total: ${tours.length}`);
  console.log(`  English titles: ${englishTitle}`);
  console.log(`  With price > 0: ${hasPrice}`);
  console.log(`  With description: ${hasDesc}`);
  console.log(`  With inclusions: ${hasInclusions}`);
  console.log(`  Top destinations:`, Object.entries(dests).slice(0, 5));
}

analyzeSource('EgyptGate', egTours);
analyzeSource('MarsaWaves', mwTours);
analyzeSource('HurghadaForYou', h4uTours);
analyzeSource('Albatros', albTours);
