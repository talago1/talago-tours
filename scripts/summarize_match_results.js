const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('scripts/data/match_results.json','utf8'));
const mr = Array.isArray(raw) ? raw : raw.results;
const counts = {};
mr.forEach(r => { counts[r.classification] = (counts[r.classification]||0)+1; });
console.log('Match results classification counts:', JSON.stringify(counts));
console.log('Total:', mr.length);

// By source
const bySrc = {};
mr.forEach(r => { bySrc[r.source] = (bySrc[r.source]||{}); bySrc[r.source][r.classification] = (bySrc[r.source][r.classification]||0)+1; });
console.log('\nBy source:');
Object.entries(bySrc).forEach(([src,cls]) => console.log(' ', src, JSON.stringify(cls)));

// Class A samples
const a = mr.filter(r=>r.classification==='A');
console.log('\nClass A (' + a.length + ') samples:');
a.slice(0,10).forEach(r=>console.log(' -', r.sourceName, '->', r.matchedTourSlug, '('+r.score+'%)'));

// Class C samples (first 10 English ones)
const c = mr.filter(r=>r.classification==='C');
console.log('\nClass C (' + c.length + ') samples:');
c.slice(0,10).forEach(r=>console.log(' -', r.sourceName, '| dest:', r.destination, '| price:', r.priceFrom, '| src:', r.source));

// Class D - what destinations are missing
const d = mr.filter(r=>r.classification==='D');
const dDests = {};
d.forEach(r=>{ dDests[r.destination] = (dDests[r.destination]||0)+1; });
console.log('\nClass D (' + d.length + ') destinations:');
Object.entries(dDests).sort((a,b)=>b[1]-a[1]).forEach(([dest,cnt]) => console.log(' -', dest, ':', cnt));
