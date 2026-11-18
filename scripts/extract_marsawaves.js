/**
 * Extracts all English tours from Marsa Waves using sitemap-tours.xml + ng-state SSR payload
 */
const fs = require('fs');
const path = require('path');

const SITEMAP_URL = 'https://admin.marsawaves.com/sitemap-tours.xml';
const CONCURRENCY = 8;

async function fetchTourData(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/i);
    if (!match) return null;
    const state = JSON.parse(match[1]);
    
    // Find the real tour object (skip contact widgets)
    for (const k of Object.keys(state)) {
      const data = state[k]?.b?.data;
      if (
        data &&
        data.title &&
        data.title !== 'Talk to our travel experts' &&
        (data.trip_category || data.slug || data.itinerary || data.available_options)
      ) {
        return { data, url };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('--- EXTRACTING MARSA WAVES CATALOG (ENHANCED PRICING) ---');
  const outDir = path.join(__dirname, 'data', 'sources');
  fs.mkdirSync(outDir, { recursive: true });

  const sitemapRes = await fetch(SITEMAP_URL);
  const xml = await sitemapRes.text();
  const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const enUrls = [...new Set(locs.map(l => l.replace(/<\/?loc>/g, '')).filter(l => l.includes('/en/tours/')))];
  
  console.log(`Found ${enUrls.length} unique English tour URLs.`);

  const tours = [];
  let completed = 0;

  for (let i = 0; i < enUrls.length; i += CONCURRENCY) {
    const batch = enUrls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(url => fetchTourData(url)));
    
    for (const r of results) {
      if (!r || !r.data) continue;
      const d = r.data;
      
      // Determine destination
      let dest = d.place?.name || d.place_slug || '';
      if (!dest) {
        const parts = r.url.split('/tours/')[1]?.split('/') || [];
        dest = parts[0] || 'Egypt';
      }
      dest = dest.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Extract itinerary
      let itin = [];
      if (Array.isArray(d.itinerary)) {
        itin = d.itinerary.map((step, idx) => ({
          step: idx + 1,
          title: step.title || step.name || `Stop ${idx + 1}`,
          description: step.description || step.text || '',
          duration: step.duration || null
        }));
      }

      // Inclusions / Exclusions
      const inc = Array.isArray(d.includes) ? d.includes.map(x => typeof x === 'string' ? x : x.title || x.name) : [];
      const exc = Array.isArray(d.excludes) ? d.excludes.map(x => typeof x === 'string' ? x : x.title || x.name) : [];
      const high = Array.isArray(d.highlights) ? d.highlights.map(x => typeof x === 'string' ? x : x.title || x.name) : [];

      // Extract detailed pricing tiers from available_options
      let adultPrice = 0;
      let childPrice = null;
      let infantPrice = null;
      let childMinAge = 6, childMaxAge = 11;
      let pickupTime = null;
      let guideLang = 'English';

      if (Array.isArray(d.available_options) && d.available_options.length > 0) {
        const opt = d.available_options[0];
        pickupTime = opt.pickup_time || null;
        guideLang = opt.guide || 'English';
        if (opt.price_collective) {
          const pc = opt.price_collective;
          adultPrice = pc.adult || 0;
          if (pc.children) childPrice = pc.children;
          if (pc.infant) infantPrice = pc.infant;
          if (pc.children_age) {
            const ageParts = pc.children_age.split('-').map(Number);
            if (ageParts[0]) childMinAge = ageParts[0];
            if (ageParts[1]) childMaxAge = ageParts[1];
          }
        }
      }

      tours.push({
        sourceId: String(d.id || d.slug),
        sourceName: d.title || d.name || 'Untitled Tour',
        sourceUrl: r.url,
        destination: dest,
        category: d.trip_category?.name || d.type_slug || 'General',
        groupType: d.private ? 'Private' : 'Shared',
        duration: `${d.duration || 4} ${d.duration_type || 'hours'}`,
        durationHours: d.duration || 4,
        priceFrom: adultPrice,
        priceAdult: adultPrice,
        priceChild: childPrice,
        priceInfant: infantPrice,
        childMinAge,
        childMaxAge,
        currency: 'USD',
        pricingUnit: 'per person',
        inclusions: inc,
        exclusions: exc,
        highlights: high,
        itinerary: itin,
        departureDays: [],
        departureTimes: pickupTime ? [pickupTime] : (d.start ? [d.start] : []),
        guideLanguage: guideLang,
        hotelPickup: d.pick_up_included ?? true,
        childEligible: true,
        cancellationPolicy: d.cancellation || 'Free cancellation available',
        rawDescription: d.overview || d.short_overview || ''
      });
    }

    completed += batch.length;
    if (completed % 30 === 0 || completed >= enUrls.length) {
      console.log(`Progress: ${completed}/${enUrls.length} parsed (${tours.length} valid tours extracted)`);
    }
  }

  const output = {
    source: 'Marsa Waves',
    sourceDomain: 'marsawaves.com',
    extractedAt: new Date().toISOString(),
    totalTours: tours.length,
    tours
  };

  const outFile = path.join(outDir, 'source_marsawaves.json');
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Saved ${tours.length} tours with complete pricing to ${outFile}`);
}

main().catch(console.error);
