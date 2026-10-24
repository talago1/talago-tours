const fs = require('fs');
const tours = JSON.parse(fs.readFileSync('scripts/audit_tours_dump.json', 'utf8'));

console.log('Total tours to analyze:', tours.length);

// 1. Durations
console.log('\n=== UNUSUAL / EXTREME DURATIONS ===');
tours.forEach(t => {
  if (t.durationHours >= 15 || t.durationHours <= 1 || (t.duration && t.duration.includes('22'))) {
    console.log(`[${t.slug}] durationHours: ${t.durationHours}, duration: "${t.duration}", durationDisplay: "${t.durationDisplay}", title: "${t.title}"`);
  }
});

// 2. Price inconsistencies
console.log('\n=== PRICE INCONSISTENCIES ===');
tours.forEach(t => {
  const issues = [];
  if (t.originalPrice && t.originalPrice <= t.adultPrice) {
    issues.push(`originalPrice (${t.originalPrice}) <= adultPrice (${t.adultPrice})`);
  }
  if (t.basePriceUSD !== t.adultPrice) {
    issues.push(`basePriceUSD (${t.basePriceUSD}) !== adultPrice (${t.adultPrice})`);
  }
  if (!t.childPrice || t.childPrice <= 0) {
    issues.push(`childPrice missing or 0 (${t.childPrice})`);
  }
  if (t.childPrice && t.childPrice > t.adultPrice) {
    issues.push(`childPrice (${t.childPrice}) > adultPrice (${t.adultPrice})`);
  }
  if (issues.length > 0) {
    console.log(`[${t.slug}] ${issues.join(' | ')}`);
  }
});

// 3. Ratings and review counts
console.log('\n=== RATINGS & REVIEWS AUDIT ===');
let identicalRatings = {};
tours.forEach(t => {
  const key = `${t.ratingAverage} (${t.ratingCount} reviews, DB: ${t.realReviewCount})`;
  identicalRatings[key] = (identicalRatings[key] || 0) + 1;
});
console.log('Rating distribution (stored vs real):', identicalRatings);

// Check if any tour has ratingCount !== realReviewCount
const reviewMismatch = tours.filter(t => t.ratingCount !== t.realReviewCount);
console.log(`Tours where tour.ratingCount !== real reviews in DB: ${reviewMismatch.length}`);
if (reviewMismatch.length > 0) {
  reviewMismatch.slice(0, 5).forEach(t => {
    console.log(`- [${t.slug}] ratingCount: ${t.ratingCount}, realReviewCount: ${t.realReviewCount}, ratingAvg: ${t.ratingAverage}`);
  });
}

// 4. Grouping duplicate / overlapping tours
console.log('\n=== SEARCHING FOR OVERLAPPING TOURS ===');
// Group by common keywords or themes
const keywords = [
  { name: 'Sataya Dolphin Reef', regex: /sataya|dolphin\s+reef/i },
  { name: 'Dolphin House / Shaab El Erg', regex: /dolphin\s+house|shaab\s+el\s+erg|dolphin\s+swim/i },
  { name: 'Orange Bay / Giftun Island', regex: /orange\s+bay|giftun|paradise\s+island/i },
  { name: 'Luxor Day Trip / Valley of the Kings', regex: /luxor|karnak|valley\s+of\s+the\s+kings/i },
  { name: 'Cairo / Pyramids / GEM Day Trip', regex: /cairo|pyramid|giza|sphinx|egyptian\s+museum/i },
  { name: 'Desert Quad / ATV / Super Safari', regex: /quad|safari|atv|buggy|bedouin/i },
  { name: 'Ras Mohammed / White Island', regex: /ras\s+mohammed|white\s+island/i },
  { name: 'Hamata Islands / Qulaan', regex: /hamata|qulaan/i },
  { name: 'Abu Dabbab Turtle Bay', regex: /abu\s+dabbab|dugong|sea\s+turtle/i },
  { name: 'Submarine / Sea Scope / Semi-Submarine', regex: /submarine|sea\s+scope|semi-sub/i },
  { name: 'St. Catherine / Mount Sinai', regex: /catherine|sinai/i },
  { name: 'Diving / PADI Intro Dive', regex: /intro\s+dive|scuba|padi/i },
  { name: 'Speedboat Private Charter', regex: /speedboat/i }
];

keywords.forEach(grp => {
  const matches = tours.filter(t => grp.regex.test(t.title) || grp.regex.test(t.slug));
  if (matches.length > 1) {
    console.log(`\n--- GROUP: ${grp.name} (${matches.length} listings) ---`);
    matches.forEach(m => {
      console.log(`  * [${m.id}] slug: "${m.slug}" | title: "${m.title}" | dest: "${m.destination}" | price: $${m.adultPrice} (orig: $${m.originalPrice}) | dur: ${m.duration || m.durationHours + 'h'} | type: ${m.type}`);
    });
  }
});
