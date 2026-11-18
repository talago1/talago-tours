/**
 * Extracts tours from Albatros for Tours (https://albatrosfortours.com/wp-json/wp/v2/posts)
 */
const fs = require('fs');
const path = require('path');

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '-')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPrice(text = '') {
  const match = text.match(/(\$|€|USD|EUR)\s*(\d+)/i) || text.match(/(\d+)\s*(\$|€|USD|EUR)/i);
  if (match) {
    const num = parseFloat(match[1]) || parseFloat(match[2]);
    const curr = (match[1].match(/\d/) ? match[2] : match[1]).replace('$', 'USD').replace('€', 'EUR');
    return { price: num || 0, currency: curr };
  }
  return { price: 0, currency: 'USD' };
}

async function fetchPage(page) {
  const res = await fetch(`https://albatrosfortours.com/wp-json/wp/v2/posts?per_page=100&page=${page}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) return [];
  return res.json();
}

async function main() {
  console.log('--- EXTRACTING ALBATROS CATALOG ---');
  const outDir = path.join(__dirname, 'data', 'sources');
  fs.mkdirSync(outDir, { recursive: true });

  const page1 = await fetchPage(1);
  const page2 = await fetchPage(2);
  const allPosts = [...page1, ...page2];
  console.log(`Fetched ${allPosts.length} posts from Albatros.`);

  const tours = allPosts.map(p => {
    const title = stripHtml(p.title?.rendered || '');
    const cleanContent = stripHtml(p.content?.rendered || '');
    const { price, currency } = extractPrice(cleanContent);
    
    // Guess destination from title or slug
    let dest = 'Hurghada';
    const lower = (title + ' ' + p.slug).toLowerCase();
    if (lower.includes('шарм') || lower.includes('sharm')) dest = 'Sharm El Sheikh';
    else if (lower.includes('каир') || lower.includes('cairo')) dest = 'Cairo';
    else if (lower.includes('лукс') || lower.includes('luxor')) dest = 'Luxor';
    else if (lower.includes('марса') || lower.includes('marsa')) dest = 'Marsa Alam';
    else if (lower.includes('дахаб') || lower.includes('dahab')) dest = 'Dahab';

    return {
      sourceId: String(p.id),
      sourceName: title,
      sourceUrl: p.link,
      destination: dest,
      category: 'General',
      groupType: lower.includes('индивидуал') || lower.includes('individuell') || lower.includes('private') ? 'Private' : 'Shared',
      duration: 'Full Day',
      durationHours: 6,
      priceFrom: price,
      currency: currency,
      pricingUnit: 'per person',
      inclusions: [],
      exclusions: [],
      highlights: [],
      itinerary: [],
      departureDays: [],
      departureTimes: [],
      hotelPickup: true,
      childEligible: true,
      childMinAge: 3,
      cancellationPolicy: 'Free cancellation up to 24 hours before start',
      rawDescription: cleanContent.slice(0, 1500)
    };
  });

  const output = {
    source: 'Albatros for Tours',
    sourceDomain: 'albatrosfortours.com',
    extractedAt: new Date().toISOString(),
    totalTours: tours.length,
    tours
  };

  const outFile = path.join(outDir, 'source_albatros.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved ${tours.length} tours to ${outFile}`);
}

main().catch(console.error);
