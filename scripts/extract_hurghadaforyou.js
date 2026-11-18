/**
 * Extracts tours from Hurghada For You (https://hurghadaforyou.com/en/trips/...)
 */
const fs = require('fs');
const path = require('path');

const SITEMAP_URL = 'https://hurghadaforyou.com/sitemap.xml';
const CONCURRENCY = 6;

async function fetchTrip(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Parse JSON-LD
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    let tripLd = null;
    for (const j of jsonLdMatches) {
      try {
        const parsed = JSON.parse(j.replace(/<\/?script[^>]*>/gi, ''));
        if (parsed['@type'] === 'TouristTrip') {
          tripLd = parsed;
          break;
        }
      } catch (e) {}
    }

    const title = tripLd?.name || (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || 'Untitled';
    const cleanTitle = title.replace(/\s*·\s*Hurghada For You.*$/i, '').trim();
    
    // Extract price from offers or html
    let price = 0;
    if (tripLd?.offers?.price) {
      price = parseFloat(tripLd.offers.price);
    } else {
      const pMatch = html.match(/(\d+)\s*€/);
      if (pMatch) price = parseFloat(pMatch[1]);
    }

    // Itinerary from itinerary steps if present
    let itinerary = [];
    if (Array.isArray(tripLd?.itinerary)) {
      itinerary = tripLd.itinerary.map((item, idx) => ({
        step: idx + 1,
        title: item.name || `Stop ${idx + 1}`,
        description: item.description || ''
      }));
    }

    // Guess destination from URL
    let dest = 'Hurghada';
    const lower = (cleanTitle + ' ' + url).toLowerCase();
    if (lower.includes('cairo') || lower.includes('caire')) dest = 'Cairo';
    else if (lower.includes('luxor') || lower.includes('louxor')) dest = 'Luxor';
    else if (lower.includes('marsa')) dest = 'Marsa Alam';
    else if (lower.includes('aswan') || lower.includes('assouan')) dest = 'Aswan';
    else if (lower.includes('siwa')) dest = 'Siwa Oasis';

    return {
      sourceId: url.split('/').filter(Boolean).pop(),
      sourceName: cleanTitle,
      sourceUrl: url,
      destination: dest,
      category: 'General',
      groupType: lower.includes('private') || lower.includes('prive') ? 'Private' : 'Shared',
      duration: 'Full Day',
      durationHours: 6,
      priceFrom: price,
      currency: 'EUR',
      pricingUnit: 'per person',
      inclusions: [],
      exclusions: [],
      highlights: [],
      itinerary: itinerary,
      departureDays: [],
      departureTimes: [],
      hotelPickup: true,
      childEligible: true,
      childMinAge: 3,
      cancellationPolicy: 'Free cancellation up to 24 hours before start',
      rawDescription: tripLd?.description || ''
    };
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('--- EXTRACTING HURGHADA FOR YOU CATALOG ---');
  const outDir = path.join(__dirname, 'data', 'sources');
  fs.mkdirSync(outDir, { recursive: true });

  const smRes = await fetch(SITEMAP_URL);
  const smText = await smRes.text();
  const locs = smText.match(/<loc>([^<]+)<\/loc>/g) || [];
  const enUrls = [...new Set(locs.map(l => l.replace(/<\/?loc>/g, '')).filter(l => l.includes('/en/trips/')))];
  
  console.log(`Found ${enUrls.length} English trip URLs.`);

  const tours = [];
  for (let i = 0; i < enUrls.length; i += CONCURRENCY) {
    const batch = enUrls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchTrip));
    results.filter(Boolean).forEach(t => tours.push(t));
    console.log(`Progress: ${Math.min(i + CONCURRENCY, enUrls.length)}/${enUrls.length} trips processed.`);
  }

  const output = {
    source: 'Hurghada For You',
    sourceDomain: 'hurghadaforyou.com',
    extractedAt: new Date().toISOString(),
    totalTours: tours.length,
    tours
  };

  const outFile = path.join(outDir, 'source_hurghadaforyou.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved ${tours.length} tours to ${outFile}`);
}

main().catch(console.error);
