/**
 * Extracts tours from Egypt Gate (https://www.egyptgate.net/api/v1/tours)
 */
const fs = require('fs');
const path = require('path');

const API = 'https://www.egyptgate.net/api/v1';

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log('--- EXTRACTING EGYPT GATE CATALOG ---');
  const outDir = path.join(__dirname, 'data', 'sources');
  fs.mkdirSync(outDir, { recursive: true });

  const first = await fetchJson(`${API}/tours?limit=100&offset=0`);
  const total = first.total || 0;
  console.log(`Total tours reported by Egypt Gate: ${total}`);
  
  const allResults = [...(first.results || [])];
  for (let offset = allResults.length; offset < total; offset += 100) {
    console.log(`Fetching offset ${offset}...`);
    const page = await fetchJson(`${API}/tours?limit=100&offset=${offset}`);
    if (page.results && page.results.length > 0) {
      allResults.push(...page.results);
    } else {
      break;
    }
  }

  console.log(`Successfully fetched ${allResults.length} tour summaries.`);

  // Transform to standardized TALAGO source format
  const tours = allResults.map(item => {
    const dest = item.destination?.name || item.destination?.slug || item.city || 'Egypt';
    const durHours = item.durationHours || (item.duration ? parseInt(item.duration) : null) || 4;
    return {
      sourceId: item.id || item.slug,
      sourceName: item.name || item.title,
      sourceUrl: `https://www.egyptgate.net/en/tours/${item.slug || item.id}`,
      destination: dest,
      category: Array.isArray(item.categories) ? item.categories.join(', ') : (item.category || 'General'),
      groupType: item.type === 'PRIVATE' ? 'Private' : 'Shared',
      duration: `${durHours} hours`,
      durationHours: durHours,
      priceFrom: item.price || item.fromPrice || item.basePrice || 0,
      currency: 'USD',
      pricingUnit: 'per person',
      inclusions: Array.isArray(item.included) ? item.included : (Array.isArray(item.inclusions) ? item.inclusions : []),
      exclusions: Array.isArray(item.excluded) ? item.excluded : (Array.isArray(item.exclusions) ? item.exclusions : []),
      highlights: Array.isArray(item.highlights) ? item.highlights : [],
      itinerary: Array.isArray(item.itinerary) ? item.itinerary : [],
      departureDays: item.days || [],
      departureTimes: item.times || [],
      hotelPickup: item.hotelPickup ?? true,
      childEligible: item.childAllowed ?? true,
      childMinAge: item.childMinAge ?? 3,
      cancellationPolicy: item.cancellationPolicy || item.cancellation?.policy || 'Free cancellation up to 24 hours before start',
      rawDescription: item.description || item.summary || ''
    };
  });

  const output = {
    source: 'Egypt Gate',
    sourceDomain: 'egyptgate.net',
    extractedAt: new Date().toISOString(),
    totalTours: tours.length,
    tours
  };

  const outFile = path.join(outDir, 'source_egyptgate.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved ${tours.length} tours to ${outFile}`);
}

main().catch(console.error);
